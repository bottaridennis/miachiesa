import React, { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ClipboardList, Send } from 'lucide-react';

export default function RegistrationsView() {
  const [user] = useAuthState(auth);
  const [formsSnapshot] = useCollection(query(collection(db, 'forms'), orderBy('timestamp', 'desc')));
  const forms = formsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [activeForm, setActiveForm] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    try {
      await addDoc(collection(db, 'form_submissions'), {
        formId: activeForm.id,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        data: formData,
        timestamp: new Date().getTime()
      });
      setSubmitted(true);
      setFormData({});
    } catch (error) {
      console.error(error);
      alert('Errore durante l\'invio.');
    }
  };

  return (
    <div className="pb-24 pt-8 px-4 max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-church-100 rounded-full text-church-600 mb-2">
          <ClipboardList size={32} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-church-900">Iscrizioni</h2>
        <p className="text-church-600 max-w-xl mx-auto">
          In questa sezione puoi iscriverti alle varie attività e iniziative proposte dalla nostra parrocchia.
        </p>
      </div>

      {!activeForm && !submitted && (
        <div className="grid gap-6">
          {forms.map((form: any) => {
            const isExpired = new Date(form.deadline) < new Date();
            return (
              <div key={form.id} className="bg-white p-6 rounded-xl shadow-sm border border-church-200">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-church-900 mb-2">{form.title}</h3>
                    <p className="text-church-600 text-sm whitespace-pre-line">{form.description}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Scadenza: {new Date(form.deadline).toLocaleDateString('it-IT')}
                  </span>
                </div>
                
                <button
                  onClick={() => setActiveForm(form)}
                  disabled={isExpired}
                  className={`w-full py-3 rounded-lg font-bold transition-colors ${
                    isExpired 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-church-600 text-white hover:bg-church-500'
                  }`}
                >
                  {isExpired ? 'Iscrizioni Chiuse' : 'Compila Modulo'}
                </button>
              </div>
            );
          })}
          {forms.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-church-200">
              <p className="text-church-400 font-medium">Non ci sono moduli di iscrizione attivi al momento.</p>
            </div>
          )}
        </div>
      )}

      {activeForm && !submitted && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-church-200">
          <button 
            onClick={() => setActiveForm(null)}
            className="text-church-500 text-sm font-bold mb-6 hover:text-church-900"
          >
            &larr; Torna alla lista
          </button>
          
          <h3 className="text-2xl font-bold text-church-900 mb-2">{activeForm.title}</h3>
          <p className="text-church-600 mb-8">{activeForm.description}</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeForm.fields.map((field: any, index: number) => (
              <div key={index}>
                <label className="block text-sm font-bold text-church-900 mb-2">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-church-200 focus:ring-2 focus:ring-church-500 focus:border-church-500 transition-colors"
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({ ...formData, [field.label]: e.target.value })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    className="w-full px-4 py-3 rounded-lg border border-church-200 focus:ring-2 focus:ring-church-500 focus:border-church-500 transition-colors"
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({ ...formData, [field.label]: e.target.value })}
                  >
                    <option value="">Seleziona...</option>
                    {field.options?.map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    className="w-full px-4 py-3 rounded-lg border border-church-200 focus:ring-2 focus:ring-church-500 focus:border-church-500 transition-colors"
                    value={formData[field.label] || ''}
                    onChange={e => setFormData({ ...formData, [field.label]: e.target.value })}
                  />
                )}
              </div>
            ))}
            
            <button
              type="submit"
              className="w-full py-3 sm:py-4 bg-church-600 text-white rounded-lg font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-church-500 transition-colors mt-8 overflow-hidden px-2"
            >
              <Send size={20} className="shrink-0" /> <span className="truncate">Invia Iscrizione</span>
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div className="bg-white p-12 rounded-xl border border-church-200 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mx-auto">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-2xl font-bold text-church-900">Iscrizione Inviata!</h3>
          <p className="text-church-600">Grazie per esserti iscritto. La tua richiesta è stata registrata correttamente.</p>
          <button 
            onClick={() => { setSubmitted(false); setActiveForm(null); }}
            className="px-6 py-3 bg-church-100 text-church-700 font-bold rounded-lg hover:bg-church-200 transition-colors"
          >
            Torna alle Iscrizioni
          </button>
        </div>
      )}
    </div>
  );
}
