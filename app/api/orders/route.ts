import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

interface OrderData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  store: string;
  product: {
    id: number;
    name: string;
    price: number;
    currency: string;
    category: string;
  } | null;
  timestamp: string;
}
// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password
  },
});

export async function POST(req: Request) {
  try {
    const orderData: OrderData = await req.json();
    
    // Simple success message in Darija
    const confirmationMessage = `Baraka Allah fik a ${orderData.name}! Commande dyal ${orderData.product?.name || 'produit'} wslat 3andna. Ghadi ntslo bik f wa9t 9rib bach n2akkdo les détails. Shokran 3la thi9atk fina!`;
    
    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🛍️ New Order Received!</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Customer Information:</h3>
          <p><strong>Name:</strong> ${orderData.name}</p>
          <p><strong>Phone:</strong> ${orderData.phone}</p>
          <p><strong>Email:</strong> ${orderData.email || 'Not provided'}</p>
          <p><strong>Address:</strong> ${orderData.address}</p>
          <p><strong>Preferred Store:</strong> ${orderData.store}</p>
        </div>
        
        ${orderData.product ? `
          <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Product Details:</h3>
            <p><strong>Product:</strong> ${orderData.product.name}</p>
            <p><strong>Category:</strong> ${orderData.product.category}</p>
            <p><strong>Price:</strong> ${orderData.product.price} ${orderData.product.currency}</p>
          </div>
        ` : ''}
        
        <p style="color: #64748b; font-size: 12px;">
          Order received on: ${new Date(orderData.timestamp).toLocaleString()}
        </p>
      </div>
    `;

    // Send email notification
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        subject: `🛍️ New Order from ${orderData.name}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({ 
      success: true,
      message: confirmationMessage
    });

  } catch (error) {
    console.error('Error processing order:', error);
    
    return NextResponse.json({ 
      success: false,
      message: "Sorry, kayn mochkil f système. Jar7 contactina b téléphone."
    }, { status: 500 });
  }
}