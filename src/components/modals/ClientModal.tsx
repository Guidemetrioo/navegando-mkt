'use client';

import React, { useState, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Client } from '@/types/database';
import {
  X,
  Building,
  MapPin,
  Phone,
  User,
  Link,
  Save,
} from 'lucide-react';

export function ClientModal() {
  const {
    isClientModalOpen,
    editingClient,
    closeClientModal,
    addClient,
    updateClient,
  } = useAgenda();

  const [nome, setNome] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [endereco, setEndereco] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(-23.5505);
  const [longitude, setLongitude] = useState<number | null>(-46.6333);

  useEffect(() => {
    if (isClientModalOpen) {
      if (editingClient) {
        setNome(editingClient.nome);
        setInstagramHandle(editingClient.instagram_handle || '');
        setEndereco(editingClient.endereco || '');
        setResponsavel(editingClient.responsavel || '');
        setTelefone(editingClient.telefone || editingClient.contato || '');
        setDriveFolderUrl(editingClient.drive_folder_url || '');
        setObservacoes(editingClient.observacoes || '');
        setLatitude(editingClient.latitude || -23.5505);
        setLongitude(editingClient.longitude || -46.6333);
      } else {
        setNome('');
        setInstagramHandle('');
        setEndereco('');
        setResponsavel('');
        setTelefone('');
        setDriveFolderUrl('');
        setObservacoes('');
        setLatitude(-23.5505);
        setLongitude(-46.6333);
      }
    }
  }, [isClientModalOpen, editingClient]);

  if (!isClientModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Por favor, informe o nome do restaurante.');
      return;
    }

    const payload: Omit<Client, 'id'> = {
      nome: nome.trim(),
      instagram_handle: instagramHandle.trim() || undefined,
      endereco: endereco.trim() || undefined,
      responsavel: responsavel.trim() || undefined,
      telefone: telefone.trim() || undefined,
      contato: telefone.trim() || undefined,
      drive_folder_url: driveFolderUrl.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      latitude,
      longitude,
    };

    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      addClient(payload);
    }

    closeClientModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeClientModal}
    >
      <div
        className="relative w-full max-w-lg bg-[#16171b] border border-[#2b2d35] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-[#26282f] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A3C]/10 text-[#FF5A3C] border border-[#FF5A3C]/30 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                {editingClient ? 'Editar Restaurante' : 'Novo Restaurante Parceiro'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cadastre os dados de contato, endereço e pasta no Google Drive do cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeClientModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#26282f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Nome e @ Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Le Bife Jardins"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                @ do Instagram
              </label>
              <input
                type="text"
                placeholder="@lebife.oficial"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Endereço Físico (para validação do GPS do ponto)
            </label>
            <input
              type="text"
              placeholder="Rua Oscar Freire, 1050 - Jardins, São Paulo - SP"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
            />
          </div>

          {/* Responsável e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome do Gerente / Responsável
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Oliveira (Sócio)"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
            </div>
          </div>

          {/* Pasta do Google Drive (Anti-Perda) */}
          <div className="p-3.5 rounded-2xl bg-[#1c1d22] border border-[#2b2d35] flex flex-col gap-2">
            <span className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Link className="w-3.5 h-3.5 text-[#38bdf8]" />
              Pasta de Arquivos no Google Drive
            </span>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveFolderUrl}
              onChange={(e) => setDriveFolderUrl(e.target.value)}
              className="w-full bg-[#26282f] border border-[#32353e] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
            />
            <span className="text-[10px] text-zinc-400">
              Esta pasta conterá todos os brutos de câmeras e vídeos finais gravados pela equipe para este restaurante.
            </span>
          </div>

          {/* Observações / Preferências Gastronômicas */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Observações e Roteiro de Gravação
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Não gravar nas segundas; foco em vinhos finos e sobremesas da estação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#26282f]">
            <button
              type="button"
              onClick={closeClientModal}
              className="flex-1 py-2.5 rounded-xl border border-[#2b2d35] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold transition-all shadow-lg shadow-[#FF5A3C]/25 cursor-pointer"
            >
              {editingClient ? 'Atualizar Restaurante' : 'Cadastrar Restaurante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
