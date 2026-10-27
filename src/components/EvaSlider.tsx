/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getEvaColorInfo } from '../utils/clinicalCalculations.ts';

interface EvaSliderProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  id?: string;
  readOnly?: boolean;
}

export const EvaSlider: React.FC<EvaSliderProps> = ({
  value,
  onChange,
  label = 'Escala Visual Analógica de Dor (EVA)',
  id = 'eva-slider',
  readOnly = false,
}) => {
  const currentVal = Math.round(Number(value) || 0);
  const info = getEvaColorInfo(currentVal);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-slate-800">
            {label}
          </label>
          <p className="text-xs text-slate-500">
            Graduação clínica de 0 (sem dor) a 10 (pior dor possível)
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${info.badgeClass}`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: info.accentHex }}
          />
          <span>{info.label}</span>
        </div>
      </div>

      {/* Visual Slider Track */}
      <div className="space-y-3">
        <div className="relative pt-1">
          <input
            type="range"
            id={id}
            min={0}
            max={10}
            step={1}
            value={currentVal}
            disabled={readOnly}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-linear-to-r from-emerald-500 via-amber-400 via-70% to-rose-600 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={currentVal}
          />
        </div>

        {/* Tactile number step selectors */}
        <div className="grid grid-cols-11 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
            const isSelected = currentVal === step;
            return (
              <button
                key={step}
                type="button"
                disabled={readOnly}
                onClick={() => onChange(step)}
                aria-label={`Selecionar nível de dor ${step}`}
                className={`flex flex-col items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold ring-2 ring-teal-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                } disabled:cursor-not-allowed`}
              >
                <span>{step}</span>
              </button>
            );
          })}
        </div>

        {/* Clinical labels */}
        <div className="flex justify-between text-[11px] text-slate-500 font-medium px-0.5">
          <span className="text-emerald-700 font-semibold">0: Sem Dor</span>
          <span className="text-teal-700">1-3: Leve</span>
          <span className="text-amber-700">4-6: Moderada</span>
          <span className="text-orange-700">7-9: Intensa</span>
          <span className="text-rose-700 font-semibold">10: Insuportável</span>
        </div>
      </div>
    </div>
  );
};
