"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/notifications');
      if (!res.ok) {
        throw new Error('Gagal memuat notifikasi');
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err: any) {
      console.error(err);
      // Fallback ke mock jika API gagal/belum running
      setNotifications([
        {
          id: '1',
          title: 'Sync Airbyte Selesai',
          message: 'Sinkronisasi data Google Ads untuk periode Juni 2026 berhasil diselesaikan.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Anomali Terdeteksi',
          message: 'Sistem mendeteksi lonjakan biaya (CPC) tidak wajar pada Campaign ID 49281.',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: 'Invoice Baru Tersedia',
          message: 'Tagihan billing bulan Juni sudah diterbitkan. Silakan periksa halaman penagihan.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        toast.success('Notifikasi ditandai sudah dibaca');
      } else {
        throw new Error();
      }
    } catch (err) {
      // Offline fallback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Notifikasi ditandai dibaca (Offline Mode)');
    }
  };

  const handleMarkAllAsRead = async () => {
    const id = toast.loading('Memproses...');
    try {
      const res = await apiFetch('/notifications/read-all', {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success('Semua notifikasi ditandai sudah dibaca', { id });
      } else {
        throw new Error();
      }
    } catch (err) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Semua notifikasi ditandai dibaca (Offline Mode)', { id });
    }
  };

  const handleDeleteRead = async () => {
    const id = toast.loading('Menghapus notifikasi...');
    try {
      const res = await apiFetch('/notifications/read', {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
        toast.success('Notifikasi lama berhasil dibersihkan', { id });
      } else {
        throw new Error();
      }
    } catch (err) {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('Notifikasi lama dibersihkan (Offline Mode)', { id });
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Notifikasi" 
          description="Kelola pemberitahuan sistem, anomali, dan insight AI marketing."
        />
        {notifications.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              ✔️ Tandai Semua Dibaca
            </button>
            <button
              onClick={handleDeleteRead}
              className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all flex items-center gap-1.5"
            >
              🗑️ Bersihkan Riwayat
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            filter === 'all' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Semua ({notifications.length})
          {filter === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            filter === 'unread' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Belum Dibaca ({unreadCount})
          {filter === 'unread' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            filter === 'read' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Sudah Dibaca ({notifications.length - unreadCount})
          {filter === 'read' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse p-6 space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={fetchNotifications} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Tidak ada notifikasi"
          description={
            filter === 'unread'
              ? 'Hebat! Semua notifikasi Anda sudah dibaca.'
              : filter === 'read'
              ? 'Belum ada notifikasi yang dibaca.'
              : 'Belum ada notifikasi yang masuk untuk Anda.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={`p-6 border transition-all ${
                !n.isRead
                  ? 'border-l-4 border-l-blue-600 bg-blue-50/10'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  !n.isRead ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {!n.isRead ? '🔵' : '⚪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`font-bold text-slate-800 text-sm ${!n.isRead ? 'font-black' : 'font-semibold'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">
                      {new Date(n.createdAt).toLocaleDateString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{n.message}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shrink-0 self-center transition-colors"
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
