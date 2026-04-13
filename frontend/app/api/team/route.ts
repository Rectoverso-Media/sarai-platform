import { NextResponse } from 'next/server';

export async function GET() {
  // Ini data dummy yang kemarin
  const mockTeam = [
    { id: 1, name: 'Arif Bagus', email: 'arif@rectoverso.com', role: 'Administrator', status: 'Active', avatar: 'AB' },
    { id: 2, name: 'Yusuf Backend', email: 'yusuf@rectoverso.com', role: 'Developer', status: 'Active', avatar: 'YB' },
    { id: 3, name: 'Kak Hassan', email: 'hassan@rectoverso.com', role: 'Project Manager', status: 'Active', avatar: 'KH' },
    { id: 4, name: 'Sarah Marketing', email: 'sarah@client.com', role: 'Viewer', status: 'Pending', avatar: 'SM' },
  ];

  // Lazy loading 1500ms
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  return NextResponse.json(mockTeam);
}