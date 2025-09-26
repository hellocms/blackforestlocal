import React, { useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useRouter } from 'next/router';

const { Option } = Select;

const EditUser = ({ userData, error }) => {
    const [form] = Form.useForm();
    const router = useRouter();

    useEffect(() => {
        // Check if userData is valid and set form values
        if (userData) {
            form.setFieldsValue(userData);
        } else {
            message.error(`Failed to load user data: ${error || "Unknown error"}`);
        }
    }, [userData, error, form]);

    const handleUpdate = async (values) => {
        message.loading({ content: 'Updating...', key: 'updatable' });
        const { id } = router.query;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await response.json();

            if (response.ok) {
                message.success({ content: 'Update successful!', key: 'updatable', duration: 2 });
                router.push('/user/list'); // Redirect to user list or dashboard
            } else {
                message.error('Update failed: ' + data.message);
            }
        } catch (error) {
            console.error('Update error:', error);
            message.error('Update failed: Network or server error');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h2>Edit User Account</h2>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: 'Please input your name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="username"
                    label="Username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="address"
                    label="Address"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please input your phone number!', pattern: new RegExp(/^[0-9]+$/), max: 10 }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Please input your password!', min: 6 }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true, message: 'Please select your role!' }]}
                >
                    <Select placeholder="Select a role">
                        <Option value="Super Admin">Super Admin</Option>
                        <Option value="Admin">Admin</Option>
                        <Option value="Store">Store</Option>
                        <Option value="Kitchen">Kitchen</Option>
                        <Option value="Accounts">Accounts</Option>
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Update
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export async function getServerSideProps(context) {
    const { id } = context.params;
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${id}`);
        const userData = await response.json();

        if (!response.ok) {
            throw new Error(userData.message || "Failed to fetch user");
        }

        return { props: { userData } };
    } catch (error) {
        return { props: { error: error.message || "Failed to fetch data" } };
    }
}

export default EditUser;
