"use client";
import React, { useState } from 'react';

export default function SettingsNotifications() {
  const [alerts, setAlerts] = useState({ inApp: true, email: true, slack: false, webhook: false });
  const [threshold, setThreshold] = useState({ errorRate: 5, queryDuration: 3000 });

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Notifikasi & Alert Rules</h2>
      
      <div className="mb-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Notification Channels</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-700">In-App Alerts</p>
              <p className="text-xs text-slate-500">Muncul di dashboard UI</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={alerts.inApp} onChange={() => setAlerts({...alerts, inApp: !alerts.inApp})} />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-700">Email Alerts</p>
              <p className="text-xs text-slate-500">Kirim ke email utama</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={alerts.email} onChange={() => setAlerts({...alerts, email: !alerts.email})} />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-700">Slack Webhook</p>
              <p className="text-xs text-slate-500">Kirim ke channel tim</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={alerts.slack} onChange={() => setAlerts({...alerts, slack: !alerts.slack})} />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-700">Custom Webhook</p>
              <p className="text-xs text-slate-500">Payload JSON eksternal</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={alerts.webhook} onChange={() => setAlerts({...alerts, webhook: !alerts.webhook})} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Alert Thresholds</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Query Error Rate Alert (%)</label>
            <div className="flex gap-4 items-center">
              <input type="number" value={threshold.errorRate} onChange={(e) => setThreshold({...threshold, errorRate: Number(e.target.value)})} className="border border-slate-300 rounded-lg px-4 py-2 w-24 text-slate-700 focus:outline-none focus:border-blue-500" />
              <span className="text-sm text-slate-500">Picu alert jika error query melebihi persentase ini dalam 1 jam.</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Slow Query Threshold (ms)</label>
            <div className="flex gap-4 items-center">
              <input type="number" value={threshold.queryDuration} onChange={(e) => setThreshold({...threshold, queryDuration: Number(e.target.value)})} className="border border-slate-300 rounded-lg px-4 py-2 w-32 text-slate-700 focus:outline-none focus:border-blue-500" />
              <span className="text-sm text-slate-500">Picu alert jika durasi eksekusi query melebihi batas milidetik ini.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
          Save Preferencessss
        </button>
      </div>
    </div>
  );
}
