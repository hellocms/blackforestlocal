import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req) {
  const token = req.cookies.get('token') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.redirect('/login');
  }
  try {
    jwt.verify(token, 'your-secret-key'); // Replace with your actual secret
  } catch (error) {
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/inventory', '/products/:path*'], // Protect these routes
};