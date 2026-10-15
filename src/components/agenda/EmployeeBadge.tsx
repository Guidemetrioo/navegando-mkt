'use client';

import React from 'react';
import { Employee } from '@/types/database';
import { Video, Sparkles } from 'lucide-react';

interface EmployeeBadgeProps {
  employee: Employee;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showRole?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EmployeeBadge({
  employee,
  size = 'md',
  showName = true,
  showRole = false,
  isSelected = true,
  onClick,
  className = '',
}: EmployeeBadgeProps) {
  // Cores por hue: hsl(cor, 58%, 38%) com texto branco
  const bgColor = `hsl(${employee.cor}, 58%, 38%)`;
  
  // Iniciais do membro (ex: Vitinho -> "VI", Giovana -> "GI")
  const initials = employee.nome.slice(0, 2).toUpperCase();

  const isFilmmaker = employee.funcao === 'filmmaker';
  const roleLabel = isFilmmaker ? 'Filmmaker' : employee.funcao === 'criadora' ? 'Criadora' : '';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  const circleSizeClasses = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-xs',
  };

  const tooltipText = `${employee.nome}${roleLabel ? ` (${roleLabel})` : ''}`;

  if (!showName) {
    return (
      <span
        style={{ backgroundColor: bgColor }}
        className={`inline-flex items-center justify-center font-bold text-white rounded-full transition-transform hover:scale-105 shrink-0 select-none ${circleSizeClasses[size]} ${className}`}
        title={tooltipText}
      >
        {initials}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{ backgroundColor: bgColor }}
      title={tooltipText}
      className={`inline-flex items-center rounded-full text-white font-medium transition-all select-none shrink-0 ${
        sizeClasses[size]
      } ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''} ${
        !isSelected ? 'opacity-35 grayscale-[50%]' : 'opacity-100 shadow-sm'
      } ${className}`}
    >
      <span className="flex items-center justify-center w-4 h-4 bg-black/30 text-white font-bold rounded-full text-[9px] leading-none shrink-0">
        {isFilmmaker ? (
          <Video className="w-2.5 h-2.5" />
        ) : employee.funcao === 'criadora' ? (
          <Sparkles className="w-2.5 h-2.5" />
        ) : (
          initials
        )}
      </span>
      <span className="whitespace-nowrap truncate font-medium">{employee.nome}</span>
      {showRole && roleLabel && (
        <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-normal opacity-90">
          {roleLabel}
        </span>
      )}
    </button>
  );
}
