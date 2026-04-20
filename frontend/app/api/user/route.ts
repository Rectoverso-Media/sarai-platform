import { NextResponse } from 'next/server';

export async function GET() {
  // Tester mock data
  const mockUser = {
    id: "USR-001",
    name: "Arif",
    role: "Admin",
    company: "Rectoverso Media",
    status: "Active"
  };

  // loading/delay 1 detik
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({ 
    success: true, 
    data: mockUser 
  });
}