import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { turnkeyService, TurnkeyServiceFeature, TurnkeyServiceTimeline } from '../services/turnkeyService';

export const TurnkeyManager: React.FC = () => {
  const [features, setFeatures] = useState<TurnkeyServiceFeature[]>([]);
  const [timeline, setTimeline] = useState<TurnkeyServiceTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  // Feature Form State
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<TurnkeyServiceFeature | null>(null);
  const [featureFormData, setFeatureFormData] = useState<Partial<TurnkeyServiceFeature>>({});

  // Timeline Form State
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<TurnkeyServiceTimeline | null>(null);
  const [timelineFormData, setTimelineFormData] = useState<Partial<TurnkeyServiceTimeline>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, t] = await Promise.all([
        turnkeyService.getFeatures(),
        turnkeyService.getTimeline()
      ]);
      setFeatures(f.sort((a, b) => a.order_index - b.order_index));
      setTimeline(t.sort((a, b) => a.order_index - b.order_index));
    } catch (e) {
      console.error('Failed to load turnkey data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureFormData.title || !featureFormData.description) return;
    
    const featureToSave: TurnkeyServiceFeature = {
      id: editingFeature ? editingFeature.id : Date.now().toString(),
      title: featureFormData.title,
      description: featureFormData.description,
      order_index: featureFormData.order_index ?? features.length + 1,
      is_active: featureFormData.is_active ?? true
    };

    await turnkeyService.updateFeature(featureToSave);
    setIsFeatureModalOpen(false);
    fetchData();
  };

  const handleDeleteFeature = async (id: string) => {
    if (confirm('Are you sure you want to delete this feature?')) {
      await turnkeyService.deleteFeature(id);
      fetchData();
    }
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineFormData.title || !timelineFormData.description) return;
    
    const timelineToSave: TurnkeyServiceTimeline = {
      id: editingTimeline ? editingTimeline.id : Date.now().toString(),
      title: timelineFormData.title,
      description: timelineFormData.description,
      order_index: timelineFormData.order_index ?? timeline.length + 1,
      is_active: timelineFormData.is_active ?? true
    };

    await turnkeyService.updateTimeline(timelineToSave);
    setIsTimelineModalOpen(false);
    fetchData();
  };

  const handleDeleteTimeline = async (id: string) => {
    if (confirm('Are you sure you want to delete this timeline step?')) {
      await turnkeyService.deleteTimeline(id);
      fetchData();
    }
  };

  const openAddFeature = () => {
    setEditingFeature(null);
    setFeatureFormData({ is_active: true, order_index: features.length + 1 });
    setIsFeatureModalOpen(true);
  };

  const openEditFeature = (f: TurnkeyServiceFeature) => {
    setEditingFeature(f);
    setFeatureFormData(f);
    setIsFeatureModalOpen(true);
  };

  const openAddTimeline = () => {
    setEditingTimeline(null);
    setTimelineFormData({ is_active: true, order_index: timeline.length + 1 });
    setIsTimelineModalOpen(true);
  };

  const openEditTimeline = (t: TurnkeyServiceTimeline) => {
    setEditingTimeline(t);
    setTimelineFormData(t);
    setIsTimelineModalOpen(true);
  };

  if (loading) {
    return <div className="text-neutral-400 p-8 text-center">Loading Turnkey Content...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Features Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">"Why Choose Us" Features</h3>
            <p className="text-neutral-400 text-sm">Manage the highlights displayed on the Turnkey service page.</p>
          </div>
          <button onClick={openAddFeature} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Feature
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950/50 text-neutral-400 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Title</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {features.map((f) => (
                <tr key={f.id} className="hover:bg-neutral-800/30">
                  <td className="p-4 text-neutral-300">{f.order_index}</td>
                  <td className="p-4 text-white font-medium">{f.title}</td>
                  <td className="p-4 text-neutral-400 max-w-xs truncate">{f.description}</td>
                  <td className="p-4">
                    {f.is_active ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-neutral-600" />}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditFeature(f)} className="p-2 text-neutral-400 hover:text-amber-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteFeature(f.id)} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Workflow Timeline</h3>
            <p className="text-neutral-400 text-sm">Manage the step-by-step process timeline.</p>
          </div>
          <button onClick={openAddTimeline} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Step
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950/50 text-neutral-400 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Title</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {timeline.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-800/30">
                  <td className="p-4 text-neutral-300">{t.order_index}</td>
                  <td className="p-4 text-white font-medium">{t.title}</td>
                  <td className="p-4 text-neutral-400 max-w-xs truncate">{t.description}</td>
                  <td className="p-4">
                    {t.is_active ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-neutral-600" />}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditTimeline(t)} className="p-2 text-neutral-400 hover:text-amber-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteTimeline(t.id)} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Modal */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">{editingFeature ? 'Edit Feature' : 'Add Feature'}</h3>
            <form onSubmit={handleSaveFeature} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                <input type="text" value={featureFormData.title || ''} onChange={e => setFeatureFormData({...featureFormData, title: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                <textarea value={featureFormData.description || ''} onChange={e => setFeatureFormData({...featureFormData, description: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white h-24" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Order Index</label>
                  <input type="number" value={featureFormData.order_index || 1} onChange={e => setFeatureFormData({...featureFormData, order_index: parseInt(e.target.value)})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={featureFormData.is_active !== false} onChange={e => setFeatureFormData({...featureFormData, is_active: e.target.checked})} className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500" />
                    <span className="text-neutral-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={() => setIsFeatureModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium">Save Feature</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {isTimelineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">{editingTimeline ? 'Edit Timeline Step' : 'Add Timeline Step'}</h3>
            <form onSubmit={handleSaveTimeline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                <input type="text" value={timelineFormData.title || ''} onChange={e => setTimelineFormData({...timelineFormData, title: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                <textarea value={timelineFormData.description || ''} onChange={e => setTimelineFormData({...timelineFormData, description: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white h-24" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Order Index</label>
                  <input type="number" value={timelineFormData.order_index || 1} onChange={e => setTimelineFormData({...timelineFormData, order_index: parseInt(e.target.value)})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={timelineFormData.is_active !== false} onChange={e => setTimelineFormData({...timelineFormData, is_active: e.target.checked})} className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500" />
                    <span className="text-neutral-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={() => setIsTimelineModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium">Save Step</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
