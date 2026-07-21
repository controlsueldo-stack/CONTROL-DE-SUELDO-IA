export interface CategoryData {
  basico: number;
  presentismo: number;
  viatico: number;
  adiNoRem: number;
  total: number;
}

export interface MonthAdicionales {
  aeroportuario: number;
  adNeuquen: number;
  adicionalVacacional: number;
}

export interface SalaryPeriod {
  categories: {
    [categoryName: string]: CategoryData;
  };
  adicionales: MonthAdicionales;
}

export interface SalaryDatabase {
  [monthName: string]: SalaryPeriod;
}

export const SALARY_DATABASE: SalaryDatabase = {
  JULIO: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1001300,
        presentismo: 180000,
        viatico: 505500,
        adiNoRem: 20000,
        total: 1706800,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1065500,
        presentismo: 195100,
        viatico: 505500,
        adiNoRem: 20000,
        total: 1786100,
      },
      "Administrativo / Guía Técnico": {
        basico: 1095000,
        presentismo: 203000,
        viatico: 505500,
        adiNoRem: 20000,
        total: 1823500,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1128000,
        presentismo: 210700,
        viatico: 505500,
        adiNoRem: 20000,
        total: 1864200,
      },
    },
    adicionales: {
      aeroportuario: 135660,
      adNeuquen: 77200,
      adicionalVacacional: 20220,
    },
  },
  AGOSTO: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1020300,
        presentismo: 180000,
        viatico: 514500,
        adiNoRem: 30000,
        total: 1744800,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1086200,
        presentismo: 195100,
        viatico: 514500,
        adiNoRem: 30000,
        total: 1825800,
      },
      "Administrativo / Guía Técnico": {
        basico: 1116600,
        presentismo: 203000,
        viatico: 514500,
        adiNoRem: 30000,
        total: 1864100,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1150500,
        presentismo: 210700,
        viatico: 514500,
        adiNoRem: 30000,
        total: 1905700,
      },
    },
    adicionales: {
      aeroportuario: 138200,
      adNeuquen: 78700,
      adicionalVacacional: 20580,
    },
  },
  SEPTIEMBRE: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1037600,
        presentismo: 180000,
        viatico: 524000,
        adiNoRem: 50000,
        total: 1791600,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1105700,
        presentismo: 195100,
        viatico: 524000,
        adiNoRem: 50000,
        total: 1874800,
      },
      "Administrativo / Guía Técnico": {
        basico: 1137100,
        presentismo: 203000,
        viatico: 524000,
        adiNoRem: 50000,
        total: 1914100,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1172100,
        presentismo: 210700,
        viatico: 524000,
        adiNoRem: 50000,
        total: 1956800,
      },
    },
    adicionales: {
      aeroportuario: 140600,
      adNeuquen: 80000,
      adicionalVacacional: 20960,
    },
  },
  OCTUBRE: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1053200,
        presentismo: 180000,
        viatico: 534000,
        adiNoRem: 60000,
        total: 1827200,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1123000,
        presentismo: 195100,
        viatico: 534000,
        adiNoRem: 60000,
        total: 1912100,
      },
      "Administrativo / Guía Técnico": {
        basico: 1155100,
        presentismo: 203000,
        viatico: 534000,
        adiNoRem: 60000,
        total: 1952100,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1191000,
        presentismo: 210700,
        viatico: 534000,
        adiNoRem: 60000,
        total: 1995700,
      },
    },
    adicionales: {
      aeroportuario: 142700,
      adNeuquen: 81200,
      adicionalVacacional: 21360,
    },
  },
  NOVIEMBRE: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1069000,
        presentismo: 180000,
        viatico: 545000,
        adiNoRem: 70000,
        total: 1864000,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1140500,
        presentismo: 195100,
        viatico: 545000,
        adiNoRem: 70000,
        total: 1950600,
      },
      "Administrativo / Guía Técnico": {
        basico: 1173400,
        presentismo: 203000,
        viatico: 545000,
        adiNoRem: 70000,
        total: 1991400,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1210200,
        presentismo: 210700,
        viatico: 545000,
        adiNoRem: 70000,
        total: 2035900,
      },
    },
    adicionales: {
      aeroportuario: 144900,
      adNeuquen: 82400,
      adicionalVacacional: 21800,
    },
  },
  DICIEMBRE: {
    categories: {
      "Vigilador General / Controlador Admisión": {
        basico: 1085000,
        presentismo: 180000,
        viatico: 545000,
        adiNoRem: 120000,
        total: 1930000,
      },
      "Vigilador Bombero / Verif. Eventos / Op. Monitoreo": {
        basico: 1159500,
        presentismo: 195100,
        viatico: 545000,
        adiNoRem: 120000,
        total: 2019600,
      },
      "Administrativo / Guía Técnico": {
        basico: 1194000,
        presentismo: 203000,
        viatico: 545000,
        adiNoRem: 120000,
        total: 2062000,
      },
      "Vigilador Principal / Instalador Sistemas": {
        basico: 1232300,
        presentismo: 210700,
        viatico: 545000,
        adiNoRem: 120000,
        total: 2108000,
      },
    },
    adicionales: {
      aeroportuario: 147000,
      adNeuquen: 83600,
      adicionalVacacional: 21800,
    },
  },
};

export interface CalculationInputs {
  month: string;
  category: string;
  antiguedad: number;
  horasExtras50: number;
  horasExtras100: number;
  horasNocturnas: number;
  diasVacaciones: number;
  tieneAeroportuario: boolean;
  tieneAdNeuquen: boolean;
  tieneSindicato: boolean;
}

export interface CalculationResult {
  month: string;
  category: string;
  
  // Base values
  basico: number;
  presentismo: number;
  viaticoOriginal: number;
  viaticoDescuento: number;
  viaticoFinal: number;
  adiNoRem: number;
  
  // Calculations
  antiguedadMonto: number;
  horaBase: number;
  horasExtras50Monto: number;
  horasExtras100Monto: number;
  plusNocturnoMonto: number;
  plusVacacionalMonto: number;
  aeroportuarioMonto: number;
  adNeuquenMonto: number;
  
  // Totals
  subtotalRemunerativo: number;
  subtotalNoRemunerativo: number;
  
  // Deductions
  deduccionJubilacion: number; // 11%
  deduccionObraSocial: number; // 3%
  deduccionLey19032: number; // 3%
  deduccionSindicato: number; // 2% (optional)
  totalDeducciones: number;
  
  // Final Net
  sueldoBruto: number;
  sueldoNeto: number;
}

export function calculateSalary(inputs: CalculationInputs): CalculationResult {
  const {
    month,
    category,
    antiguedad,
    horasExtras50,
    horasExtras100,
    horasNocturnas,
    diasVacaciones,
    tieneAeroportuario,
    tieneAdNeuquen,
    tieneSindicato,
  } = inputs;

  const monthData = SALARY_DATABASE[month] || SALARY_DATABASE.JULIO;
  const catData = monthData.categories[category] || monthData.categories["Vigilador General / Controlador Admisión"];
  
  const basico = catData.basico;
  const presentismo = catData.presentismo;
  const viaticoOriginal = catData.viatico;
  const adiNoRem = catData.adiNoRem;
  
  // 1. Antigüedad: 1% del Sueldo Básico por cada año
  const antiguedadMonto = Math.round(basico * 0.01 * antiguedad);
  
  // 2. Valor de la Hora Base: Sueldo Básico / 200
  const horaBase = basico / 200;
  
  // 3. Horas Extras 50%: Hora Base * 1.5 * qty
  const horasExtras50Monto = Math.round(horaBase * 1.5 * horasExtras50);
  
  // 4. Horas Extras 100%: Hora Base * 2 * qty
  const horasExtras100Monto = Math.round(horaBase * 2 * horasExtras100);
  
  // 5. Plus Nocturno: Hora Base * 0.35 * qty
  const plusNocturnoMonto = Math.round(horaBase * 0.35 * horasNocturnas);
  
  // 6. Plus Vacacional: Fixed sum multiplied by the number of vacation days
  const plusVacacionalMonto = Math.round(monthData.adicionales.adicionalVacacional * diasVacaciones);
  
  // 7. Descuento de Viático por Vacaciones: (Monto viatico / 30) * diasVacaciones. Subtract from viáticos
  const viaticoDiario = viaticoOriginal / 30;
  const viaticoDescuento = diasVacaciones > 0 ? Math.round(viaticoDiario * diasVacaciones) : 0;
  const viaticoFinal = Math.max(0, viaticoOriginal - viaticoDescuento);

  // Additional bonuses
  const aeroportuarioMonto = tieneAeroportuario ? monthData.adicionales.aeroportuario : 0;
  const adNeuquenMonto = tieneAdNeuquen ? monthData.adicionales.adNeuquen : 0;

  // Remunerative subtotal (Básico, Presentismo, Antigüedad, Horas Extras, Plus Nocturno, Plus Vacacional, Aeroportuario, Neuquén)
  // Note: Standard Argentine rules consider Básico, Presentismo, Antigüedad, Horas Extras, Plus Nocturno, Plus Vacacional as Remunerative.
  // Neuquén and Aeroportuario are also Remunerative additions.
  const subtotalRemunerativo = 
    basico + 
    presentismo + 
    antiguedadMonto + 
    horasExtras50Monto + 
    horasExtras100Monto + 
    plusNocturnoMonto + 
    plusVacacionalMonto + 
    aeroportuarioMonto + 
    adNeuquenMonto;

  // Non-Remunerative subtotal (Viático, Adi No Remunerativo)
  const subtotalNoRemunerativo = viaticoFinal + adiNoRem;

  // Deductions (Apply to Remunerative items)
  const deduccionJubilacion = Math.round(subtotalRemunerativo * 0.11);
  const deduccionObraSocial = Math.round(subtotalRemunerativo * 0.03);
  const deduccionLey19032 = Math.round(subtotalRemunerativo * 0.03);
  const deduccionSindicato = tieneSindicato ? Math.round(subtotalRemunerativo * 0.02) : 0;

  const totalDeducciones = deduccionJubilacion + deduccionObraSocial + deduccionLey19032 + deduccionSindicato;

  const sueldoBruto = subtotalRemunerativo;
  const sueldoNeto = (subtotalRemunerativo - totalDeducciones) + subtotalNoRemunerativo;

  return {
    month,
    category,
    basico,
    presentismo,
    viaticoOriginal,
    viaticoDescuento,
    viaticoFinal,
    adiNoRem,
    antiguedadMonto,
    horaBase,
    horasExtras50Monto,
    horasExtras100Monto,
    plusNocturnoMonto,
    plusVacacionalMonto,
    aeroportuarioMonto,
    adNeuquenMonto,
    subtotalRemunerativo,
    subtotalNoRemunerativo,
    deduccionJubilacion,
    deduccionObraSocial,
    deduccionLey19032,
    deduccionSindicato,
    totalDeducciones,
    sueldoBruto,
    sueldoNeto,
  };
}
