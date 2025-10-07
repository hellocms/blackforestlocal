const Order = require('../models/Order');
const BillCounter = require('../models/BillCounter');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const Inventory = require('../models/Inventory');
const { reduceStock } = require('./inventoryController');

const supportsTransactions = async () => {
  try {
    const adminDb = Order.db.admin();
    const isMaster = await adminDb.serverStatus();
    return !!isMaster.setName || !!isMaster.isMongos;
  } catch {
    return false;
  }
};

const createOrder = async (req, res) => {
  const { useTransaction } = req.body;
  const shouldUseTransaction = useTransaction || await supportsTransactions();
  let session = null;
  if (shouldUseTransaction) {
    session = await Order.startSession();
    session.startTransaction();
  }

  try {
    const {
      branchId,
      tab,
      products,
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems,
      status,
      waiterId,
      deliveryDateTime,
      tableId,
    } = req.body;

    if (
      !branchId ||
      !tab ||
      !products ||
      !paymentMethod ||
      subtotal === undefined ||
      totalGST === undefined ||
      totalWithGST === undefined ||
      totalItems === undefined
    ) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array cannot be empty' });
    }

    for (const product of products) {
      if (
        !product.productId ||
        !product.name ||
        !product.quantity ||
        !product.price ||
        !product.unit ||
        product.gstRate === undefined ||
        !product.productTotal ||
        product.productGST === undefined ||
        product.bminstock === undefined
      ) {
        return res.status(400).json({ message: 'Invalid product data' });
      }
      if (!(typeof product.gstRate === 'number' && product.gstRate >= 0) && product.gstRate !== 'non-gst') {
        return res.status(400).json({ message: 'gstRate must be a non-negative number or "non-gst"' });
      }
      if (product.gstRate === 'non-gst' && product.productGST !== 0) {
        return res.status(400).json({ message: 'Non-GST items must have productGST set to 0' });
      }
      product.sendingQty = product.sendingQty !== undefined ? product.sendingQty : 0;
      product.receivedQty = product.receivedQty !== undefined ? product.receivedQty : 0;
      product.confirmed = product.confirmed !== undefined ? product.confirmed : false;
      product.updatedAt = product.updatedAt || null;

      const billedQty = Math.max(product.quantity, product.sendingQty);
      product.billedQty = billedQty;
      product.productTotal = billedQty * product.price;
      if (product.gstRate === 'non-gst') {
        product.productGST = 0;
      } else {
        product.productGST = product.productTotal * (product.gstRate / 100);
      }
    }

    const recalculatedSubtotal = products.reduce((sum, p) => sum + p.productTotal, 0);
    const recalculatedTotalGST = products.reduce((sum, p) => sum + p.productGST, 0);
    const recalculatedTotalWithGST = recalculatedSubtotal + recalculatedTotalGST;
    const recalculatedTotalItems = products.filter(p => p.billedQty > 0).length;

    const branch = await Branch.findById(branchId, null, { session });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    const branchName = branch.name || `Branch ${branchId}`;
    const branchPrefix = branchName.substring(0, 3).toUpperCase();

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const dateStr = `${today.getFullYear()}-${month}-${day}`;

    const billCounter = await BillCounter.findOneAndUpdate(
      { branchId, date: dateStr },
      { $inc: { count: 1 } },
      { upsert: true, new: true, session }
    );
    const billCount = String(billCounter.count).padStart(2, '0');
    const billNo = `${branchPrefix}${day}${month}${year}${billCount}`;

    let table = null;
    if (tab === 'tableOrder' && tableId) {
      table = await Table.findById(tableId, null, { session });
      if (!table) return res.status(404).json({ message: 'Table not found' });
      if (table.status === 'Occupied' && table.currentOrder) {
        return res.status(400).json({ message: 'Table is already occupied with an active order' });
      }
    }

    const order = new Order({
      branchId,
      tab,
      products,
      paymentMethod,
      subtotal: recalculatedSubtotal,
      totalGST: recalculatedTotalGST,
      totalWithGST: recalculatedTotalWithGST,
      totalItems: recalculatedTotalItems,
      status: status || 'draft',
      billNo,
      waiterId: waiterId || null,
      deliveryDateTime: deliveryDateTime ? new Date(deliveryDateTime) : null,
      tableId: tableId || null,
    });

    const savedOrder = await order.save({ session });

    if (status === 'completed') {
      await reduceStock(branchId, products, session);
    }

    if (tab === 'tableOrder' && table) {
      if (status === 'draft') {
        table.status = 'Occupied';
        table.currentOrder = savedOrder._id;
      } else if (status === 'completed') {
        table.status = 'Free';
        table.currentOrder = null;
      }
      await table.save({ session });
    }

    if (shouldUseTransaction) {
      await session.commitTransaction();
    }

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('branchId')
      .populate('waiterId', 'name')
      .populate('tableId');

    res.status(201).json({ message: 'Order saved successfully', order: populatedOrder });
  } catch (error) {
    if (shouldUseTransaction && session) {
      await session.abortTransaction();
    }
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Error saving order', error: error.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { branchId, tab, status, startDate, endDate } = req.query;
    let query = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (tab) {
      query.tab = tab;
    } else {
      query.tab = { $in: ['stock', 'liveOrder', 'billing'] };
    }
    if (status) {
      query.status = status;
    }
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('branchId', 'name')
      .populate('waiterId', 'name')
      .populate('tableId', 'tableNo');
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  let session = null;

  try {
    const shouldUseTransaction = await supportsTransactions();
    if (shouldUseTransaction) {
      session = await Order.startSession();
      session.startTransaction();
    }

    const order = await Order.findById(id).session(session);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If the order is associated with a table, update table status
    if (order.tab === 'tableOrder' && order.tableId) {
      const table = await Table.findById(order.tableId).session(session);
      if (table) {
        table.status = 'Free';
        table.currentOrder = null;
        await table.save({ session });
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(id).session(session);

    if (shouldUseTransaction) {
      await session.commitTransaction();
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (shouldUseTransaction && session) {
      await session.abortTransaction();
    }
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const updateStockOrderStatus = async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] Checking for overdue orders`);

    const OVERDUE_HOURS = process.env.OVERDUE_HOURS || 3;
    const overdueThreshold = new Date(now.getTime() - OVERDUE_HOURS * 60 * 60 * 1000);

    const overdueStockOrders = await Order.find({
      tab: 'stock',
      status: 'neworder',
      deliveryDateTime: { $lt: now },
    });

    const overdueLiveOrders = await Order.find({
      tab: 'liveOrder',
      status: 'neworder',
      createdAt: { $lt: overdueThreshold },
    });

    const allOverdueOrders = [...overdueStockOrders, ...overdueLiveOrders];

    if (allOverdueOrders.length > 0) {
      console.log(`Found ${allOverdueOrders.length} overdue orders:`, allOverdueOrders.map(o => o._id));
      await Order.updateMany(
        { _id: { $in: allOverdueOrders.map(order => order._id) } },
        { $set: { status: 'pending' } }
      );
      console.log('Updated overdue orders to pending');
    } else {
      console.log('No overdue orders found');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

const updateSendingQty = async (req, res) => {
  const { useTransaction } = req.body;
  const shouldUseTransaction = useTransaction || await supportsTransactions();
  let session = null;
  if (shouldUseTransaction) {
    session = await Order.startSession();
    session.startTransaction();
  }

  try {
    const { id } = req.params;
    const { products: incomingProducts, status } = req.body;

    if (!incomingProducts && !status) {
      return res.status(400).json({ message: 'At least one of products or status must be provided' });
    }

    const order = await Order.findById(id).populate('branchId', 'name', null, { session });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (incomingProducts) {
      if (!Array.isArray(incomingProducts)) {
        return res.status(400).json({ message: 'Products must be an array' });
      }

      const updatedProducts = order.products.map((existingProduct, index) => {
        const newProduct = incomingProducts[index] || {};
        const wasConfirmed = existingProduct.confirmed || false;
        const willBeConfirmed = newProduct.confirmed !== undefined ? newProduct.confirmed : wasConfirmed;
        const updated = {
          ...existingProduct.toObject(),
          sendingQty: newProduct.sendingQty !== undefined ? newProduct.sendingQty : existingProduct.sendingQty || 0,
          receivedQty: newProduct.receivedQty !== undefined ? newProduct.receivedQty : existingProduct.receivedQty || 0,
          confirmed: willBeConfirmed,
          quantity: newProduct.quantity !== undefined ? newProduct.quantity : existingProduct.quantity,
          gstRate: newProduct.gstRate !== undefined ? newProduct.gstRate : existingProduct.gstRate,
          updatedAt: !wasConfirmed && willBeConfirmed ? new Date() : existingProduct.updatedAt,
        };

        const billedQty = Math.max(updated.quantity, updated.sendingQty);
        updated.billedQty = billedQty;
        updated.productTotal = billedQty * updated.price;

        if (updated.gstRate === 'non-gst') {
          updated.productGST = 0;
        } else if (typeof updated.gstRate === 'number' && updated.gstRate >= 0) {
          updated.productGST = updated.productTotal * (updated.gstRate / 100);
        } else {
          updated.productGST = newProduct.productGST !== undefined ? newProduct.productGST : existingProduct.productGST || 0;
        }

        return updated;
      });
      order.products = updatedProducts;

      order.subtotal = order.products.reduce((sum, p) => sum + p.productTotal, 0);
      order.totalGST = order.products.reduce((sum, p) => sum + p.productGST, 0);
      order.totalWithGST = order.subtotal + order.totalGST;
      order.totalItems = order.products.filter(p => p.billedQty > 0).length;
    }

    if (status) {
      const validStatuses = ['neworder', 'pending', 'completed', 'draft', 'delivered', 'received'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      if (status === 'delivered' && order.status !== 'completed') {
        return res.status(400).json({ message: 'Order must be completed before marking as delivered' });
      }
      if (status === 'received' && order.status !== 'delivered') {
        return res.status(400).json({ message: 'Order must be delivered before marking as received' });
      }

      if (status === 'delivered' && (order.tab === 'stock' || order.tab === 'liveOrder')) {
        for (const product of order.products) {
          if (product.sendingQty > 0) {
            let factoryInventory = await Inventory.findOne({ productId: product.productId, locationId: null }, null, { session });
            if (!factoryInventory) {
              throw new Error(`No factory stock found for product ${product.name}`);
            }
            if (factoryInventory.inStock < product.sendingQty) {
              throw new Error(`Insufficient factory stock for ${product.name}`);
            }
            factoryInventory.inStock -= product.sendingQty;
            factoryInventory.stockHistory.push({
              date: new Date(),
              change: -product.sendingQty,
              reason: `Transferred to ${order.branchId.name} (${order.tab === 'stock' ? 'Stock' : 'Live'} Order)`,
            });
            await factoryInventory.save({ session });

            let branchInventory = await Inventory.findOne({ productId: product.productId, locationId: order.branchId._id }, null, { session });
            if (!branchInventory) {
              branchInventory = new Inventory({
                productId: product.productId,
                locationId: order.branchId._id,
                inStock: 0,
                lowStockThreshold: 5,
              });
            }
            branchInventory.inStock += product.sendingQty;
            branchInventory.stockHistory.push({
              date: new Date(),
              change: product.sendingQty,
              reason: `Received from Factory (${order.tab === 'stock' ? 'Stock' : 'Live'} Order)`,
            });
            await branchInventory.save({ session });
          }
        }
        order.deliveredAt = new Date();
      } else if (status === 'received') {
        for (const product of order.products) {
          const actualReceived = product.receivedQty || product.sendingQty || 0;
          if (actualReceived > 0) {
            const shortfall = (product.sendingQty || 0) - actualReceived;
            if (shortfall > 0) {
              let branchInventory = await Inventory.findOne({ productId: product.productId, locationId: order.branchId._id }, null, { session });
              if (branchInventory) {
                branchInventory.inStock -= shortfall;
                branchInventory.stockHistory.push({
                  date: new Date(),
                  change: -shortfall,
                  reason: `Partial receipt adjustment for ${order.billNo}`,
                });
                await branchInventory.save({ session });
              }
            }
          }
        }
        order.receivedAt = new Date();
      }
      order.status = status;
    }

    const updatedOrder = await order.save({ session });

    if (shouldUseTransaction) {
      await session.commitTransaction();
    }

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('branchId', 'name')
      .populate('waiterId', 'name')
      .populate('tableId', 'tableNo');

    res.status(200).json({ message: 'Order updated successfully', order: populatedOrder });
  } catch (error) {
    if (shouldUseTransaction && session) {
      await session.abortTransaction();
    }
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = { createOrder, getAllOrders, deleteOrder, updateStockOrderStatus, updateSendingQty };