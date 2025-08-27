import React from 'react';

interface Participant {
  id: string;
  nome: string;
  tamanho: string;
  igreja?: string;
  cidade?: string;
  comprador_nome: string;
}

interface LabelPrintProps {
  participants: Participant[];
}

const LabelPrint: React.FC<LabelPrintProps> = ({ participants }) => {
  // Mapeamento de cores por tamanho conforme especificação
  const colorMap: { [key: string]: string } = {
    'P': '#3B82F6',   // bg-blue-500
    'M': '#10B981',   // bg-green-500
    'G': '#EAB308',   // bg-yellow-500
    'GG': '#F97316',  // bg-orange-500
    'XG': '#EF4444',  // bg-red-500
    'XXG': '#A855F7', // bg-purple-500
    'E1': '#EC4899',  // bg-pink-500
    'E2': '#6366F1',  // bg-indigo-500
  };

  const getColorForSize = (tamanho: string): string => {
    return colorMap[tamanho] || '#9CA3AF'; // gray-400 como padrão
  };

  // Preencher até 33 etiquetas (3x11 grid)
  const totalLabels = 33;
  const labels = [...participants];
  while (labels.length < totalLabels) {
    labels.push({
      id: `empty-${labels.length}`,
      nome: '',
      tamanho: '',
      igreja: '',
      cidade: '',
      comprador_nome: ''
    });
  }

  const printContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Impressão de Etiquetas - UMADEPAR</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
        <style>
            /* Estilos gerais e reset */
            body {
                margin: 0;
                font-family: 'Inter', sans-serif;
                background-color: #fff;
            }

            /* Estilização da folha A4 para visualização na tela */
            .a4-sheet {
                width: 210mm;
                height: 297mm;
                margin: 0;
                background: white;
                box-shadow: none;
                box-sizing: border-box;
                padding: 16px;
            }

            /* Grid que contém todas as etiquetas */
            .labels-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(11, 1fr);
                height: calc(297mm - 32px);
                width: calc(210mm - 32px);
                gap: 0;
            }

            /* Estilo individual de cada etiqueta */
            .label {
                display: flex;
                align-items: stretch;
                overflow: hidden;
                border: 0.5px solid #f0f2f5;
            }

            .color-bar {
                width: 10px;
                flex-shrink: 0;
            }

            .content {
                flex-grow: 1;
                padding: 5px 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .info {
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 1px;
                width: calc(100% - 42px);
            }

            .participant-name {
                font-size: 14px;
                font-weight: 800;
                color: #111827;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .divider {
                height: 1px;
                background-color: #d1d5db;
                width: 100%;
                margin: 1px 0;
            }

            .details {
                font-size: 9px;
                color: #374151;
                line-height: 1.3;
            }
            .details strong {
                font-weight: 700;
            }

            .size-badge {
                width: 37px;
                height: 37px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 16px;
                font-weight: 800;
                flex-shrink: 0;
            }
            
            /* Estilos para impressão */
            @media print {
                .a4-sheet {
                    padding: 16px;
                }
                .label {
                    border: none;
                }
            }
            
            @page {
                size: A4;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="a4-sheet">
            <div class="labels-grid">
                ${labels.slice(0, totalLabels).map(participant => {
                  if (!participant.nome) {
                    return '<div class="label"></div>';
                  }
                  
                  const color = getColorForSize(participant.tamanho);
                  return `
                    <div class="label">
                        <div class="color-bar" style="background-color: ${color};"></div>
                        <div class="content">
                            <div class="info">
                                <div class="participant-name">${participant.nome}</div>
                                <div class="divider"></div>
                                <div class="details">
                                    <strong>Igreja:</strong> ${participant.igreja || 'Não informado'}<br>
                                    <strong>Cidade:</strong> ${participant.cidade || 'Não informado'}<br>
                                    <strong>Comprador:</strong> ${participant.comprador_nome}
                                </div>
                            </div>
                            <div class="size-badge" style="background-color: ${color};">
                                ${participant.tamanho}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </body>
    </html>
  `;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="label-print-component">
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-[#edbe66] text-[#0f2b45] rounded-lg hover:bg-[#d4a853] transition-colors font-medium"
      >
        Imprimir Etiquetas
      </button>
    </div>
  );
};

export default LabelPrint;