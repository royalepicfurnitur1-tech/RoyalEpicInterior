import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { HeritageHomeItem, getHeritageHomes, saveHeritageHome, deleteHeritageHome } from '../services/heritageHomeService';

export const HeritageHomesManager: React.FC = () => {
  const [items, setItems] = useState<HeritageHomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<HeritageHomeItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await getHeritageHomes();
    setItems(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const res = await saveHeritageHome(editingItem);
    if (res.success) {
      setEditingItem(null);
      loadItems();
    } else {
      alert('Error saving: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this heritage home?')) {
      const success = await deleteHeritageHome(id);
      if (success) {
        loadItems();
      } else {
        alert('Failed to delete item.');
      }
    }
  };

  const handleEdit = (item: HeritageHomeItem) => {
    setEditingItem({ ...item });
  };

  const handleAdd = () => {
    setEditingItem({
      id: '',
      slug: '',
      sectionNumber: items.length + 1,
      title: '',
      subtitle: '',
      fullDescription: '',
      image: '',
      alt: '',
      designStyle: '',
      architecturalFeatures: '',
      interiorCharacter: '',
      suitableFor: '',
      highlights: [],
      keyElements: [],
      published: true
    });
  };

  if (loading) return <div className="p-8 text-center">Loading Heritage Homes...</div>;

  if (editingItem) {
    return (
      <div className="p-6 bg-white rounded-xl text-neutral-900 border border-neutral-200">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h3 className="text-xl font-bold">{editingItem.id ? 'Edit' : 'Add'} Heritage Home</h3>
          <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Title</label>
              <input 
                type="text" 
                required 
                value={editingItem.title} 
                onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Slug (URL friendly)</label>
              <input 
                type="text" 
                value={editingItem.slug} 
                onChange={e => setEditingItem({...editingItem, slug: e.target.value})}
                placeholder="Leave blank to auto-generate"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1">Subtitle (Short Description)</label>
              <input 
                type="text" 
                value={editingItem.subtitle} 
                onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Main Image URL</label>
              <input 
                type="url" 
                required
                value={editingItem.image} 
                onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Image Alt Text</label>
              <input 
                type="text" 
                value={editingItem.alt} 
                onChange={e => setEditingItem({...editingItem, alt: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Design Style</label>
              <input 
                type="text" 
                value={editingItem.designStyle} 
                onChange={e => setEditingItem({...editingItem, designStyle: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Display Order</label>
              <input 
                type="number" 
                value={editingItem.sectionNumber} 
                onChange={e => setEditingItem({...editingItem, sectionNumber: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1">Architectural Features</label>
              <textarea 
                rows={3}
                value={editingItem.architecturalFeatures} 
                onChange={e => setEditingItem({...editingItem, architecturalFeatures: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1">Interior Character</label>
              <textarea 
                rows={3}
                value={editingItem.interiorCharacter} 
                onChange={e => setEditingItem({...editingItem, interiorCharacter: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1">Suitable For</label>
              <textarea 
                rows={2}
                value={editingItem.suitableFor} 
                onChange={e => setEditingItem({...editingItem, suitableFor: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Highlights (comma separated)</label>
              <input 
                type="text" 
                value={editingItem.highlights.join(', ')} 
                onChange={e => setEditingItem({...editingItem, highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g. Traditional Roof, Carved Wood"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">Key Elements (comma separated)</label>
              <input 
                type="text" 
                value={editingItem.keyElements.join(', ')} 
                onChange={e => setEditingItem({...editingItem, keyElements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g. Teak Pillars, Athangudi Tiles"
              />
            </div>
            
            <div className="md:col-span-2 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="published"
                checked={editingItem.published} 
                onChange={e => setEditingItem({...editingItem, published: e.target.checked})}
                className="w-5 h-5 text-amber-500 focus:ring-amber-500 rounded"
              />
              <label htmlFor="published" className="font-bold text-neutral-700">Published (Visible on website)</label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setEditingItem(null)}
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden text-neutral-900">
      <div className="p-6 border-b flex justify-between items-center bg-neutral-50">
        <div>
          <h2 className="text-xl font-bold">Heritage Homes Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage the architectural content for the Heritage Homes page</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-200 text-sm uppercase tracking-wider text-neutral-600">
              <th className="p-4 font-bold">Order</th>
              <th className="p-4 font-bold">Image</th>
              <th className="p-4 font-bold">Title</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.sort((a, b) => a.sectionNumber - b.sectionNumber).map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="p-4 font-medium text-neutral-500">{item.sectionNumber}</td>
                <td className="p-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-16 h-12 object-cover rounded shadow-sm border border-neutral-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-12 bg-neutral-200 rounded flex items-center justify-center text-neutral-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-bold text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-500 truncate max-w-xs">{item.subtitle}</p>
                </td>
                <td className="p-4">
                  {item.published ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      <CheckCircle className="w-3.5 h-3.5" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                      <XCircle className="w-3.5 h-3.5" /> Draft
                    </span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  No heritage home items found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
