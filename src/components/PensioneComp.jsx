import React, { useState, useMemo } from 'react';

// ============================================================================
// PENSIONE — CLASSIFICA FONDI APERTI
// Fonte: COVIP - Commissione di Vigilanza sui Fondi Pensione
// Rendimenti netti al 31/12/2024 (pubblicazione ufficiale COVIP giugno 2025).
// Prossimo aggiornamento atteso: giugno 2026.
// ============================================================================

// --- DATI COVIP ---
const COVIP_DATA = [{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":-0.66,"r3":-4.09,"r5":-2.51,"r10":-0.9,"r20":0.54},{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"BILANCIATO","cat":"Bilanciato","r1":4.81,"r3":-1.22,"r5":0.78,"r10":1.37,"r20":2.29},{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"AZIONARIO","cat":"Azionario","r1":10.43,"r3":1.41,"r5":4.23,"r10":3.87,"r20":3.29},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA FLESSIBILE","cat":"Obb. Puro","r1":1.62,"r3":-3.25,"r5":-1.8,"r10":-0.02,"r20":1.66},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA BILANCIATA","cat":"Bilanciato","r1":7.57,"r3":-0.31,"r5":1.79,"r10":2.46,"r20":3.25},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA AZIONARIA","cat":"Azionario","r1":16.18,"r3":4.17,"r5":6.95,"r10":5.95,"r20":5.07},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA OBBLIGAZIONARIA BREVE TERMINE","cat":"Obb. Puro","r1":2.2,"r3":-0.01,"r5":-0.34,"r10":null,"r20":null},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA OBBLIGAZIONARIA LUNGO TERMINE","cat":"Obb. Puro","r1":1.69,"r3":-1.73,"r5":-1.33,"r10":null,"r20":null},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA MULTIASSET","cat":"Bilanciato","r1":4.66,"r3":-0.83,"r5":0.45,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA FLESSIBILE","cat":"Obb. Puro","r1":1.95,"r3":-2.9,"r5":-1.4,"r10":0.15,"r20":1.05},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA","cat":"Obb. Misto","r1":3.83,"r3":-0.2,"r5":0.32,"r10":0.64,"r20":1.93},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA BILANCIATA","cat":"Azionario","r1":10.29,"r3":2.27,"r5":3.99,"r10":3.69,"r20":3.99},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA AZIONARIA","cat":"Azionario","r1":17.67,"r3":4.99,"r5":7.9,"r10":6.85,"r20":5.9},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA BREVE TERMINE","cat":"Obb. Puro","r1":2.6,"r3":0.28,"r5":-0.05,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA LUNGO TERMINE","cat":"Obb. Puro","r1":2.22,"r3":-1.36,"r5":-0.92,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA MULTIASSET","cat":"Bilanciato","r1":5.32,"r3":-0.18,"r5":0.98,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"PRUDENTE ESG","cat":"Obb. Misto","r1":3.32,"r3":-0.04,"r5":0.65,"r10":0.9,"r20":1.71},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"BILANCIATA ESG","cat":"Bilanciato","r1":2.97,"r3":-1.45,"r5":1.27,"r10":2.25,"r20":3.19},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"SVILUPPO ESG","cat":"Bilanciato","r1":3.94,"r3":-0.52,"r5":2.7,"r10":3.48,"r20":3.85},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"ESPANSIONE ESG","cat":"Azionario","r1":5.25,"r3":1.27,"r5":5.02,"r10":5.12,"r20":4.51},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"GARANTITA ESG","cat":"Bilanciato","r1":2.43,"r3":0.28,"r5":0.18,"r10":0.48,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"OBBLIGAZIONARIO MISTO 25% ESG","cat":"Obb. Misto","r1":2.3,"r3":-1.88,"r5":0.44,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"BILANCIATO 50% ESG","cat":"Bilanciato","r1":3.63,"r3":-0.68,"r5":2.4,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"AZIONARIO 75% ESG","cat":"Azionario","r1":4.33,"r3":-0.2,"r5":3.67,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"AZIONARIO PLUS 90% ESG","cat":"Azionario","r1":5.11,"r3":0.55,"r5":4.76,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"GARANTITO ESG","cat":"Obb. Misto","r1":2.36,"r3":0.27,"r5":-0.05,"r10":null,"r20":null},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"CRESCITA 25+","cat":"Azionario","r1":13.66,"r3":3.69,"r5":6.79,"r10":6.0,"r20":5.52},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"RIVALUTAZIONE 10+","cat":"Bilanciato","r1":7.44,"r3":0.04,"r5":2.3,"r10":2.76,"r20":3.71},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"CONSERVAZIONE 3+","cat":"Obb. Puro","r1":2.55,"r3":-1.28,"r5":-0.87,"r10":0.05,"r20":1.27},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"GARANZIA 1+","cat":"Obb. Puro","r1":2.76,"r3":1.35,"r5":0.55,"r10":0.06,"r20":0.64},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"INCREMENTO E GARANZIA 5+","cat":"Bilanciato","r1":3.77,"r3":0.76,"r5":1.05,"r10":1.45,"r20":null},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"EQUILIBRIO 5+","cat":"Bilanciato","r1":5.15,"r3":-0.76,"r5":0.37,"r10":1.25,"r20":null},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"RENDITA SOSTENIBILE","cat":"Bilanciato","r1":5.34,"r3":0.05,"r5":1.21,"r10":1.6,"r20":2.85},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"CRESCITA SOSTENIBILE","cat":"Bilanciato","r1":7.91,"r3":0.3,"r5":2.55,"r10":2.7,"r20":3.2},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"ALTA CRESCITA SOSTENIBILE","cat":"Bilanciato","r1":11.74,"r3":2.52,"r5":5.3,"r10":4.2,"r20":3.74},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"OBIETTIVO TFR","cat":"Obb. Misto","r1":4.17,"r3":1.64,"r5":1.12,"r10":0.6,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"PRUDENTE","cat":"Obb. Puro","r1":2.21,"r3":-1.03,"r5":-0.82,"r10":-0.2,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"EQUILIBRATA","cat":"Bilanciato","r1":6.46,"r3":1.39,"r5":2.6,"r10":2.5,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"DINAMICA","cat":"Azionario","r1":8.44,"r3":1.83,"r5":4.39,"r10":3.97,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"GARANTITA","cat":"Obb. Misto","r1":3.24,"r3":-0.6,"r5":-0.03,"r10":0.37,"r20":null},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"MONETA","cat":"Obb. Puro","r1":1.92,"r3":-1.07,"r5":-0.52,"r10":-0.01,"r20":1.02},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"STABILITÀ","cat":"Bilanciato","r1":5.81,"r3":0.58,"r5":1.95,"r10":2.24,"r20":2.81},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"MISTA","cat":"Bilanciato","r1":8.5,"r3":1.05,"r5":3.32,"r10":3.62,"r20":3.84},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"CRESCITA","cat":"Azionario","r1":11.57,"r3":2.34,"r5":5.08,"r10":4.95,"r20":4.72},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"GARANTITA","cat":"Obb. Misto","r1":2.58,"r3":-0.1,"r5":-0.05,"r10":-0.19,"r20":0.37},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"EQUILIBRATO","cat":"Bilanciato","r1":6.41,"r3":1.31,"r5":2.47,"r10":2.58,"r20":2.41},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"CRESCITA","cat":"Azionario","r1":9.71,"r3":1.96,"r5":3.96,"r10":2.86,"r20":2.82},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":2.53,"r3":0.07,"r5":0.74,"r10":1.17,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO CONSERVATIVO","cat":"Bilanciato","r1":3.7,"r3":0.16,"r5":null,"r10":null,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO","cat":"Bilanciato","r1":4.57,"r3":0.38,"r5":null,"r10":null,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO ACCRESCITIVO","cat":"Bilanciato","r1":5.37,"r3":0.41,"r5":null,"r10":null,"r20":null},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"OBBLIGAZIONARIO ESG","cat":"Obb. Misto","r1":1.1,"r3":-1.9,"r5":-1.28,"r10":-0.39,"r20":0.87},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"BILANCIATO ESG","cat":"Bilanciato","r1":7.85,"r3":1.07,"r5":2.77,"r10":2.83,"r20":3.28},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"AZIONARIO ESG","cat":"Azionario","r1":14.76,"r3":4.22,"r5":6.37,"r10":5.43,"r20":4.66},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"PRUDENTE  ESG","cat":"Obb. Puro","r1":2.23,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"GARANTITO  ESG","cat":"Obb. Puro","r1":2.8,"r3":1.44,"r5":0.59,"r10":0.1,"r20":null},{"s":"BIM VITA","f":"BIM VITA","c":"BOND","cat":"Obb. Misto","r1":2.31,"r3":-1.11,"r5":-0.73,"r10":-0.24,"r20":1.73},{"s":"BIM VITA","f":"BIM VITA","c":"EQUILIBRIO","cat":"Bilanciato","r1":4.67,"r3":0.2,"r5":0.5,"r10":0.78,"r20":1.98},{"s":"BIM VITA","f":"BIM VITA","c":"BILANCIATA  GLOBALE","cat":"Bilanciato","r1":10.05,"r3":5.14,"r5":4.63,"r10":3.37,"r20":2.99},{"s":"BIM VITA","f":"BIM VITA","c":"EQUITY","cat":"Azionario","r1":15.8,"r3":8.52,"r5":7.25,"r10":5.02,"r20":4.08},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"SAFE","cat":"Obb. Puro","r1":0.98,"r3":-2.96,"r5":-1.92,"r10":-0.63,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"ACTIVITY","cat":"Bilanciato","r1":2.65,"r3":-1.84,"r5":0.03,"r10":1.29,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"DYNAMIC","cat":"Bilanciato","r1":5.3,"r3":1.23,"r5":3.14,"r10":3.42,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"GUARANTY","cat":"Obb. Misto","r1":2.31,"r3":0.56,"r5":0.25,"r10":null,"r20":null},{"s":"CNP VITA ASSICURA","f":"CNP","c":"AZIONARIO","cat":"Azionario","r1":6.36,"r3":1.23,"r5":3.55,"r10":3.82,"r20":3.98},{"s":"CNP VITA ASSICURA","f":"CNP","c":"BILANCIATO","cat":"Bilanciato","r1":3.24,"r3":-1.13,"r5":0.89,"r10":1.72,"r20":2.95},{"s":"CNP VITA ASSICURA","f":"CNP","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":2.2,"r3":-2.04,"r5":-0.25,"r10":0.83,"r20":2.45},{"s":"CNP VITA ASSICURA","f":"CNP","c":"GARANZIA RESTITUZIONE CAPITALE","cat":"Obb. Misto","r1":2.31,"r3":-0.31,"r5":0.31,"r10":0.74,"r20":2.23},{"s":"CNP VITA ASSICURA","f":"CNP","c":"GARANZIA DI RENDIMENTO MIN.","cat":"Obb. Misto","r1":2.19,"r3":-0.46,"r5":0.21,"r10":0.49,"r20":1.87},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"OBBLIGAZIONARIO GARANTITO","cat":"Obb. Misto","r1":4.79,"r3":-0.97,"r5":0.25,"r10":1.1,"r20":2.3},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"FLESSIBILE","cat":"Obb. Misto","r1":2.98,"r3":0.56,"r5":1.43,"r10":1.66,"r20":1.81},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"BILANCIATO","cat":"Bilanciato","r1":7.36,"r3":1.33,"r5":2.75,"r10":3.23,"r20":3.39},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"AZIONARIO","cat":"Azionario","r1":11.86,"r3":4.82,"r5":5.96,"r10":5.42,"r20":4.58},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA GARANTITA","cat":"Bilanciato","r1":1.97,"r3":-0.76,"r5":0.04,"r10":0.79,"r20":null},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA MODERATA","cat":"Bilanciato","r1":7.13,"r3":-0.47,"r5":2.49,"r10":3.35,"r20":4.03},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA DINAMICA","cat":"Azionario","r1":10.75,"r3":2.84,"r5":5.75,"r10":5.49,"r20":5.47},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE HIGH GROWTH","cat":"Azionario","r1":2.85,"r3":-0.52,"r5":2.32,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE GROWTH","cat":"Bilanciato","r1":2.57,"r3":-0.88,"r5":1.33,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE BALANCED GROWTH","cat":"Obb. Misto","r1":2.16,"r3":-1.43,"r5":0.31,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE CONSERVATIVE","cat":"Obb. Misto","r1":1.82,"r3":-1.92,"r5":-0.75,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE SHORT TERM","cat":"Obb. Puro","r1":2.57,"r3":0.7,"r5":0.22,"r10":null,"r20":null},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"SICUREZZA","cat":"Obb. Puro","r1":2.01,"r3":-2.82,"r5":-1.61,"r10":-0.22,"r20":1.57},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"EQUILIBRIO","cat":"Bilanciato","r1":5.23,"r3":-1.06,"r5":0.86,"r10":1.72,"r20":2.69},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"VALORE","cat":"Azionario","r1":8.41,"r3":0.37,"r5":2.98,"r10":3.25,"r20":3.33},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"CRESCITA","cat":"Azionario","r1":10.47,"r3":1.62,"r5":4.69,"r10":4.44,"r20":3.77},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"GARANZIA","cat":"Obb. Puro","r1":2.14,"r3":0.56,"r5":-0.08,"r10":-0.47,"r20":0.41},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"MILLENIALS","cat":"Azionario","r1":16.61,"r3":2.83,"r5":null,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":1.75,"r3":-2.43,"r5":-0.97,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"MULTIASSET","cat":"Bilanciato","r1":4.51,"r3":0.69,"r5":0.5,"r10":1.05,"r20":2.66},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"AZIONARIO GLOBALE","cat":"Azionario","r1":9.67,"r3":3.42,"r5":5.07,"r10":4.45,"r20":4.28},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"OBBLIGAZIONARIO BREVE TERMINE","cat":"Obb. Puro","r1":2.24,"r3":-0.14,"r5":-0.24,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"REAL RETURN","cat":"Obb. Misto","r1":2.99,"r3":0.45,"r5":0.53,"r10":null,"r20":null},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"NUOVO OBBLIGAZIONARIO ETICO","cat":"Obb. Misto","r1":2.51,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"BILANCIATO ETICO","cat":"Bilanciato","r1":6.35,"r3":-0.11,"r5":1.67,"r10":2.26,"r20":2.64},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"PREVALENTEMENTE AZIONARIO ETICO","cat":"Azionario","r1":8.44,"r3":1.58,"r5":3.62,"r10":3.79,"r20":3.66},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"PRUDENTE","cat":"Obb. Puro","r1":3.32,"r3":-0.49,"r5":-0.01,"r10":0.88,"r20":2.18},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"EQUILIBRATA","cat":"Bilanciato","r1":4.79,"r3":0.24,"r5":1.78,"r10":2.67,"r20":3.48},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"DINAMICA","cat":"Azionario","r1":6.52,"r3":1.67,"r5":4.3,"r10":5.12,"r20":3.73},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"GARANTITA","cat":"Obb. Puro","r1":3.44,"r3":-0.46,"r5":0.37,"r10":1.23,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 1 GARANTITA","cat":"Obb. Misto","r1":2.35,"r3":-0.41,"r5":-0.38,"r10":-0.37,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 2 PRUDENTE","cat":"Bilanciato","r1":4.3,"r3":-1.29,"r5":-0.3,"r10":0.5,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 3 EQUILIBRATA","cat":"Bilanciato","r1":6.46,"r3":-0.05,"r5":1.18,"r10":1.72,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 4 DINAMICA","cat":"Azionario","r1":9.16,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"TFR+","cat":"Bilanciato","r1":3.08,"r3":0.27,"r5":0.51,"r10":0.23,"r20":1.19},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"CRESCITA PRUDENTE","cat":"Obb. Misto","r1":2.36,"r3":-0.87,"r5":-0.4,"r10":0.28,"r20":1.47},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"CRESCITA DINAMICA","cat":"Obb. Misto","r1":2.94,"r3":-0.93,"r5":0.14,"r10":0.84,"r20":1.94},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"ACCUMULAZIONE BILANCIATA","cat":"Bilanciato","r1":6.9,"r3":0.88,"r5":2.91,"r10":3.0,"r20":3.47},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"RIVALUTAZIONE AZIONARIA","cat":"Azionario","r1":11.71,"r3":2.94,"r5":5.73,"r10":5.03,"r20":4.69},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"MONETARIA","cat":"Obb. Puro","r1":2.47,"r3":0.29,"r5":0.01,"r10":-0.08,"r20":1.02},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"TFR+","cat":"Bilanciato","r1":3.04,"r3":0.41,"r5":0.63,"r10":0.33,"r20":1.39},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"BILANCIATA","cat":"Bilanciato","r1":9.09,"r3":0.8,"r5":3.2,"r10":3.49,"r20":4.05},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"AZIONARIA","cat":"Azionario","r1":13.76,"r3":3.24,"r5":6.33,"r10":5.62,"r20":5.37},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"OBBLIGAZIONARIA","cat":"Obb. Puro","r1":1.22,"r3":-3.6,"r5":-2.0,"r10":-0.18,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA BREVE TERMINE","cat":"Obb. Misto","r1":2.56,"r3":0.77,"r5":0.41,"r10":0.01,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA TFR","cat":"Bilanciato","r1":2.93,"r3":0.21,"r5":0.39,"r10":0.02,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA MEDIO TERMINE","cat":"Bilanciato","r1":5.6,"r3":1.18,"r5":1.73,"r10":1.53,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA LUNGO TERMINE","cat":"Bilanciato","r1":8.69,"r3":2.73,"r5":3.93,"r10":3.37,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA BREVE TERMINE ESG","cat":"Obb. Misto","r1":2.86,"r3":-1.43,"r5":-0.55,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA MEDIO TERMINE ESG","cat":"Bilanciato","r1":5.95,"r3":-0.16,"r5":1.47,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA LUNGO TERMINE ESG","cat":"Azionario","r1":8.0,"r3":0.8,"r5":2.79,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"CAPITALE SICURO","cat":"Obb. Misto","r1":2.99,"r3":-0.09,"r5":0.11,"r10":0.11,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"GARANTITO","cat":"Obb. Puro","r1":1.95,"r3":-0.54,"r5":-0.68,"r10":-0.53,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"PRUDENTE","cat":"Obb. Misto","r1":2.78,"r3":-1.14,"r5":-0.31,"r10":0.47,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"MODERATO","cat":"Bilanciato","r1":4.21,"r3":-0.31,"r5":0.8,"r10":1.44,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"DINAMICO","cat":"Bilanciato","r1":5.92,"r3":1.06,"r5":2.7,"r10":2.85,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"AGGRESSIVO","cat":"Bilanciato","r1":8.54,"r3":2.84,"r5":4.62,"r10":4.16,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"TFR","cat":"Obb. Misto","r1":1.59,"r3":-1.33,"r5":-0.61,"r10":-0.41,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"EQUILIBRIO","cat":"Bilanciato","r1":4.02,"r3":0.01,"r5":1.13,"r10":0.93,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"INVESTIMENTO","cat":"Azionario","r1":7.36,"r3":1.82,"r5":3.94,"r10":3.1,"r20":null},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"ACTIVITAS","cat":"Azionario","r1":8.04,"r3":2.55,"r5":4.33,"r10":3.97,"r20":3.58},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SOLIDITAS","cat":"Bilanciato","r1":6.34,"r3":1.46,"r5":2.93,"r10":2.99,"r20":3.14},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"AEQUITAS","cat":"Bilanciato","r1":2.55,"r3":-1.05,"r5":0.83,"r10":1.64,"r20":null},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SERENITAS","cat":"Obb. Misto","r1":3.12,"r3":-1.04,"r5":-0.06,"r10":0.77,"r20":2.12},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SECURITAS","cat":"Obb. Misto","r1":2.82,"r3":-1.38,"r5":-0.98,"r10":0.06,"r20":1.38},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":1.39,"r3":-2.53,"r5":-1.07,"r10":-0.39,"r20":2.3},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"BILANCIATO","cat":"Bilanciato","r1":7.02,"r3":0.56,"r5":2.69,"r10":2.2,"r20":3.78},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"AZIONARIO","cat":"Azionario","r1":11.41,"r3":2.57,"r5":5.24,"r10":4.25,"r20":4.93},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"OBBLIGAZIONARIO GARANTITO","cat":"Obb. Puro","r1":3.17,"r3":0.75,"r5":1.13,"r10":0.68,"r20":1.2},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":1.79,"r3":-1.38,"r5":-0.18,"r10":0.53,"r20":1.71},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"BILANCIATO","cat":"Bilanciato","r1":2.4,"r3":-0.47,"r5":1.8,"r10":2.0,"r20":2.71},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"AZIONARIO EUROPA","cat":"Azionario","r1":5.45,"r3":2.71,"r5":5.05,"r10":4.42,"r20":4.24},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"AZIONARIO INTERNAZIONALE","cat":"Azionario","r1":11.17,"r3":3.63,"r5":6.54,"r10":5.52,"r20":5.1},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"GARANTITA ETICA","cat":"Obb. Puro","r1":2.95,"r3":0.82,"r5":0.37,"r10":0.45,"r20":1.31},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"PRUDENZIALE ETICA","cat":"Obb. Puro","r1":1.14,"r3":-3.76,"r5":-2.35,"r10":-0.44,"r20":1.56},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"BILANCIATA ETICA","cat":"Bilanciato","r1":3.32,"r3":-1.04,"r5":0.73,"r10":1.54,"r20":2.62},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"SVILUPPO ETICA","cat":"Azionario","r1":6.43,"r3":2.72,"r5":4.67,"r10":4.01,"r20":3.06},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"SICURA - OBBLIGAZIONARIA CON GARANZIA DI RENDIMENTO MINIMO","cat":"Obb. Puro","r1":3.1,"r3":-0.87,"r5":-0.37,"r10":-0.11,"r20":0.71},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"TRANQUILLA - OBBLIGAZIONARIA MISTA CON GARANZIA DI RESTITUZIONE DEL CAPITALE","cat":"Obb. Misto","r1":1.2,"r3":-3.87,"r5":-2.13,"r10":-0.34,"r20":1.64},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"SERENA - BILANCIATA","cat":"Bilanciato","r1":4.4,"r3":-1.61,"r5":0.86,"r10":1.72,"r20":2.96},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"DINAMICA - AZIONARIA INTERNAZIONALE","cat":"Azionario","r1":6.78,"r3":2.07,"r5":4.94,"r10":4.66,"r20":4.06},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":2.66,"r3":-0.39,"r5":-0.04,"r10":0.38,"r20":2.05},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO PRUDENTE","cat":"Obb. Misto","r1":3.4,"r3":-0.75,"r5":0.21,"r10":1.02,"r20":2.49},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO EQUILIBRATO","cat":"Bilanciato","r1":4.95,"r3":-0.17,"r5":1.21,"r10":1.96,"r20":3.04},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO DINAMICO","cat":"Bilanciato","r1":6.91,"r3":0.92,"r5":2.62,"r10":3.06,"r20":3.61},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"GARANTITO FLEX","cat":"Bilanciato","r1":3.41,"r3":0.64,"r5":0.86,"r10":null,"r20":null},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO ETICO","cat":"Obb. Misto","r1":3.56,"r3":-0.11,"r5":0.32,"r10":null,"r20":null},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"AZIONARIO","cat":"Azionario","r1":8.68,"r3":2.38,"r5":4.33,"r10":null,"r20":null},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-BOND","cat":"Obb. Puro","r1":0.79,"r3":-3.04,"r5":-1.97,"r10":-1.01,"r20":1.26},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-GEST","cat":"Bilanciato","r1":1.56,"r3":-2.0,"r5":-0.78,"r10":0.05,"r20":1.76},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-MIX","cat":"Bilanciato","r1":4.15,"r3":0.82,"r5":1.96,"r10":2.5,"r20":3.31},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA GARANTITA","cat":"Obb. Misto","r1":1.59,"r3":-2.61,"r5":-1.23,"r10":-0.08,"r20":1.44},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA EQUILIBRATA","cat":"Bilanciato","r1":2.19,"r3":-1.09,"r5":0.54,"r10":1.43,"r20":2.45},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA BILANCIATO INTERNAZIONALE","cat":"Bilanciato","r1":6.63,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA CAPITALIZZATA","cat":"Azionario","r1":4.17,"r3":0.78,"r5":2.63,"r10":3.24,"r20":3.0},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"GARANTITA","cat":"Obb. Puro","r1":1.31,"r3":-1.54,"r5":-1.16,"r10":-0.24,"r20":0.97},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"CONSERVATIVA","cat":"Obb. Puro","r1":1.13,"r3":-3.27,"r5":-2.12,"r10":-0.33,"r20":1.01},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"DINAMICA","cat":"Azionario","r1":6.38,"r3":0.98,"r5":2.9,"r10":3.54,"r20":3.56},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"BILANCIATA 65","cat":"Azionario","r1":6.03,"r3":0.57,"r5":2.47,"r10":3.14,"r20":3.35},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"BILANCIATA 30","cat":"Bilanciato","r1":3.61,"r3":-1.24,"r5":0.24,"r10":1.51,"r20":2.42},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"OBBLIGAZIONARIA","cat":"Obb. Puro","r1":1.29,"r3":-3.15,"r5":-2.05,"r10":-0.12,"r20":1.33},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"GARANTITA","cat":"Obb. Misto","r1":0.62,"r3":-2.21,"r5":-1.85,"r10":-1.04,"r20":0.2},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"AZIONARIA","cat":"Azionario","r1":7.92,"r3":2.3,"r5":4.22,"r10":4.24,"r20":3.68}];

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const CATEGORIES = [
  { id: 'tutti', label: 'Tutti', icon: '📊' },
  { id: 'Azionario', label: 'Azionario', icon: '📈' },
  { id: 'Bilanciato', label: 'Bilanciato', icon: '⚖️' },
  { id: 'Obb. Misto', label: 'Obb. Misto', icon: '🔄' },
  { id: 'Obb. Puro', label: 'Obb. Puro', icon: '🛡️' }
];

const HORIZONS = [
  { key: 'r1', label: '1 Anno', sub: '2024' },
  { key: 'r3', label: '3 Anni', sub: '2022-2024' },
  { key: 'r5', label: '5 Anni', sub: '2020-2024' },
  { key: 'r10', label: '10 Anni', sub: '2015-2024' },
  { key: 'r20', label: '20 Anni', sub: '2005-2024' }
];

const THEME = { primary: '#14b8a6', soft: '#ccfbf1', bg: '#f0fdfa' };

// ============================================================================
// COMPONENTE
// ============================================================================

export function PensioneComp({ color }) {
  const [categoria, setCategoria] = useState('tutti');
  const [horizon, setHorizon] = useState('r5');
  const [search, setSearch] = useState('');
  const [soloLongTrack, setSoloLongTrack] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [warningOpen, setWarningOpen] = useState(true);

  const t = THEME;
  const themeColor = color || t.primary;

  // Calcolo medie di categoria per l'orizzonte selezionato (serve per il delta)
  const medieCategoria = useMemo(() => {
    const medie = {};
    CATEGORIES.forEach(cat => {
      if (cat.id === 'tutti') return;
      const rows = COVIP_DATA.filter(
        d => d.cat === cat.id && d[horizon] !== null && d[horizon] !== undefined
      );
      if (rows.length === 0) {
        medie[cat.id] = null;
      } else {
        const sum = rows.reduce((acc, d) => acc + d[horizon], 0);
        medie[cat.id] = sum / rows.length;
      }
    });
    return medie;
  }, [horizon]);

  const filtered = useMemo(() => {
    let data = [...COVIP_DATA];

    if (categoria !== 'tutti') {
      data = data.filter(d => d.cat === categoria);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(d =>
        d.s.toLowerCase().includes(q) ||
        d.f.toLowerCase().includes(q) ||
        d.c.toLowerCase().includes(q)
      );
    }

    // Track record: richiede che r10 non sia null (10+ anni di dati)
    if (soloLongTrack) {
      data = data.filter(d => d.r10 !== null && d.r10 !== undefined);
    }

    // Rimuovi fondi senza dato per l'orizzonte selezionato
    data = data.filter(d => d[horizon] !== null && d[horizon] !== undefined);
    data.sort((a, b) => (b[horizon] || -999) - (a[horizon] || -999));

    return data;
  }, [categoria, horizon, search, soloLongTrack]);

  const displayed = showAll ? filtered : filtered.slice(0, 20);
  const activeHz = HORIZONS.find(h => h.key === horizon);

  const resetFilters = () => {
    setCategoria('tutti');
    setHorizon('r5');
    setSearch('');
    setSoloLongTrack(false);
    setShowAll(false);
  };

  // Stile base card (allineato a LuceGas/Conti/RCAuto)
  const cardBase = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 24,
    padding: '32px 24px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10
  };

  // Rendering di una "pill" di rendimento con stato positivo/negativo/n.d.
  const RendPill = ({ value, size = 'm' }) => {
    const big = size === 'l';
    const base = {
      display: 'inline-block',
      padding: big ? '6px 14px' : '4px 12px',
      borderRadius: 10,
      fontSize: big ? 16 : 13,
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums'
    };
    if (value === null || value === undefined) {
      return <span style={{ ...base, background: '#f1f5f9', color: '#94a3b8' }}>N/D</span>;
    }
    const pos = value >= 0;
    return (
      <span style={{
        ...base,
        background: pos ? '#dcfce7' : '#fee2e2',
        color: pos ? '#166534' : '#991b1b'
      }}>
        {pos ? '+' : ''}{value.toFixed(2)}%
      </span>
    );
  };

  const CatBadge = ({ cat }) => {
    const colors = {
      'Azionario': { bg: '#ede9fe', fg: '#5b21b6' },
      'Bilanciato': { bg: '#dbeafe', fg: '#1e40af' },
      'Obb. Misto': { bg: '#fef3c7', fg: '#92400e' },
      'Obb. Puro': { bg: '#e0e7ff', fg: '#3730a3' }
    };
    const c = colors[cat] || { bg: '#f1f5f9', fg: '#64748b' };
    return (
      <span style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: c.bg,
        color: c.fg
      }}>{cat}</span>
    );
  };

  // Podio per i primi 3 risultati
  const podiumBadge = (i) => {
    if (i === 0) return { icon: '🥇', bg: '#fbbf24', color: '#78350f', label: '1° POSTO' };
    if (i === 1) return { icon: '🥈', bg: '#cbd5e1', color: '#334155', label: '2° POSTO' };
    if (i === 2) return { icon: '🥉', bg: '#fdba74', color: '#7c2d12', label: '3° POSTO' };
    return null;
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          WARNING FONDI NEGOZIALI — IL PIÙ IMPORTANTE MESSAGGIO DELLA PAGINA
          ==================================================================== */}
      <div style={{
        background: '#fffbeb',
        border: '2px solid #f59e0b',
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: 28,
        boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: 15 }}>
              Prima di confrontare i fondi aperti, verifica se hai diritto a un fondo negoziale
            </div>
          </div>
          <button
            onClick={() => setWarningOpen(!warningOpen)}
            style={{
              background: 'transparent', border: 'none', color: '#92400e',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
              whiteSpace: 'nowrap'
            }}
          >{warningOpen ? '− Chiudi' : '+ Apri'}</button>
        </div>
        {warningOpen && (
          <div style={{ marginTop: 14, fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 10px' }}>
              Questa classifica copre <strong>solo i fondi pensione APERTI</strong> (commercializzati al pubblico da banche e assicurazioni). Se il tuo CCNL prevede un <strong>fondo negoziale di categoria</strong> (Cometa per i metalmeccanici, Fonte per il commercio, Cooperlavoro per le cooperative, Laborfonds per Trentino-AA, Eurofer per le ferrovie, Previvolo per l'aviazione, ecc.), quasi sempre <strong>quello è la scelta migliore</strong>:
            </p>
            <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
              <li>Costi ISC <strong>0,1% - 0,3%</strong> annuo (contro l'1% - 1,5% tipico degli aperti)</li>
              <li>Contributo obbligatorio del <strong>datore di lavoro</strong> (1-2% della RAL) che altrimenti perdi</li>
              <li>Gestione istituzionale con track record consolidato</li>
            </ul>
            <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>
              Verifica il tuo CCNL o chiedi all'ufficio risorse umane se esiste un fondo negoziale disponibile per la tua categoria. Rinunciare al fondo negoziale significa rinunciare al contributo datoriale.
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================
          BLOCCO 1 — FILTRI
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24, padding: '28px 24px' }}>

        <h2 style={{
          fontFamily: "'Playfair Display', 'DM Serif Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Classifica fondi pensione aperti
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Dati COVIP ufficiali · rendimenti netti al 31/12/2024
        </p>

        {/* Ricerca */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>🔍 Cerca per società, fondo o comparto</label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
            placeholder="es. Amundi, Allianz, Azionario ESG..."
            style={{
              width: '100%', padding: '12px 16px',
              border: '1px solid #cbd5e1', borderRadius: 12,
              fontSize: 14, boxSizing: 'border-box', outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>

        {/* Categoria */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Categoria di investimento</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = categoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategoria(cat.id); setShowAll(false); }}
                  style={{
                    padding: '8px 14px', borderRadius: 100,
                    border: active ? `1px solid ${themeColor}` : '1px solid #e2e8f0',
                    fontSize: 13, fontWeight: 700,
                    background: active ? themeColor : '#fff',
                    color: active ? '#fff' : '#64748b',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: active ? `0 4px 12px ${themeColor}40` : 'none'
                  }}
                >
                  <span style={{ marginRight: 4 }}>{cat.icon}</span>{cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orizzonte */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Ordina per rendimento medio annuo su...</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {HORIZONS.map(hz => {
              const active = horizon === hz.key;
              return (
                <button
                  key={hz.key}
                  onClick={() => { setHorizon(hz.key); setShowAll(false); }}
                  style={{
                    flex: '1 1 auto', minWidth: 70,
                    padding: '10px 14px', borderRadius: 12,
                    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: active ? '#0f172a' : '#fff',
                    color: active ? '#fff' : '#64748b',
                    fontSize: 12, fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s', textAlign: 'center',
                    boxShadow: active ? '0 4px 12px rgba(15,23,42,0.3)' : 'none'
                  }}
                >
                  <div>{hz.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{hz.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro affidabilità */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: '#f8fafc',
          borderRadius: 12, border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>
            🎯 Mostra solo fondi con track record ≥ 10 anni
          </label>
          <button
            onClick={() => { setSoloLongTrack(!soloLongTrack); setShowAll(false); }}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid ' + (soloLongTrack ? '#16a34a' : '#cbd5e1'),
              background: soloLongTrack ? '#dcfce7' : '#fff',
              color: soloLongTrack ? '#166534' : '#64748b',
              fontWeight: 700, fontSize: 12, cursor: 'pointer'
            }}
          >{soloLongTrack ? 'Sì' : 'No'}</button>
        </div>

        {/* Conteggio risultati + reset */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e2e8f0',
          fontSize: 13, color: '#64748b', flexWrap: 'wrap', gap: 8
        }}>
          <div>
            <strong style={{ color: '#0f172a' }}>{filtered.length}</strong> comparti
            {categoria !== 'tutti' && <> in <strong style={{ color: themeColor }}>{categoria}</strong></>}
            {soloLongTrack && <> con 10+ anni di storia</>}
            {' '}— ordinati per rendimento a {activeHz?.label}
          </div>
          {(categoria !== 'tutti' || search || soloLongTrack || horizon !== 'r5') && (
            <button
              onClick={resetFilters}
              style={{
                background: 'transparent', border: 'none', color: '#64748b',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >Azzera filtri</button>
          )}
        </div>
      </div>

      {/* ====================================================================
          BLOCCO 2 — LISTA COMPARTI
          ==================================================================== */}
      {displayed.map((d, i) => {
        const podio = podiumBadge(i);
        const mediaCat = medieCategoria[d.cat];
        const rendVal = d[horizon];
        const deltaMedia = mediaCat !== null && rendVal !== null ? rendVal - mediaCat : null;

        return (
          <div
            key={`${d.f}-${d.c}-${i}`}
            style={{
              background: '#fff',
              border: `2px solid ${podio ? (i === 0 ? themeColor : '#e2e8f0') : '#e2e8f0'}`,
              borderRadius: 20,
              padding: '20px 24px',
              marginBottom: 14,
              boxShadow: i === 0 ? `0 20px 40px -12px ${themeColor}30` : '0 4px 12px rgba(0,0,0,0.03)',
              position: 'relative',
              animation: `fadeInUp 0.4s ${EASE} both`,
              animationDelay: `${Math.min(i * 0.03, 0.5)}s`
            }}
          >
            {/* Podio */}
            {podio && (
              <div style={{
                position: 'absolute', top: -12, left: 20,
                background: podio.bg, color: podio.color,
                fontSize: 10, fontWeight: 900, letterSpacing: '0.05em',
                padding: '4px 10px', borderRadius: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>{podio.icon} {podio.label}</div>
            )}

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
              marginBottom: 14
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>
                  {d.f}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{d.s}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <CatBadge cat={d.cat} />
                </div>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  Comparto: {d.c}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 140 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Rend. {activeHz?.label}
                </div>
                <RendPill value={rendVal} size="l" />
                {deltaMedia !== null && (
                  <div style={{
                    marginTop: 6, fontSize: 11, fontWeight: 700,
                    color: deltaMedia >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {deltaMedia >= 0 ? '▲' : '▼'} {Math.abs(deltaMedia).toFixed(2)}pp vs media {d.cat}
                  </div>
                )}
              </div>
            </div>

            {/* Tabella rendimenti multi-orizzonte */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 8, marginTop: 12
            }}>
              {HORIZONS.map(hz => {
                const isActive = horizon === hz.key;
                const val = d[hz.key];
                const valColor = val === null || val === undefined
                  ? '#cbd5e1'
                  : val >= 0 ? '#059669' : '#dc2626';
                return (
                  <div key={hz.key} style={{
                    textAlign: 'center', padding: '8px 6px',
                    background: isActive ? t.bg : '#f8fafc',
                    borderRadius: 10,
                    border: isActive ? `1px solid ${themeColor}` : '1px solid transparent'
                  }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>
                      {hz.label}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 800, color: valColor,
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {val !== null && val !== undefined
                        ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Mostra tutti */}
      {!showAll && filtered.length > 20 && (
        <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 20 }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '12px 28px', borderRadius: 12,
              border: `2px solid ${themeColor}`, background: '#fff',
              color: themeColor, fontSize: 14, fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >Mostra tutti i {filtered.length} comparti →</button>
        </div>
      )}

      {/* Nessun risultato */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#fff', borderRadius: 20,
          border: '1px dashed #cbd5e1', color: '#94a3b8'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Nessun comparto trovato
          </div>
          <div style={{ fontSize: 13 }}>Prova ad allargare i filtri o azzerare la ricerca</div>
        </div>
      )}

      {/* ====================================================================
          DISCLAIMER FINALE — CRUCIALE PER COMPLIANCE
          ==================================================================== */}
      <div style={{
        marginTop: 40, padding: '20px 24px',
        background: '#f8fafc', borderRadius: 16,
        border: '1px solid #e2e8f0',
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Disclaimer importante
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Fonte dati:</strong> Commissione di Vigilanza sui Fondi Pensione (COVIP). Rendimenti netti da costi di gestione e imposte, aggiornati al 31 dicembre 2024 (ultima pubblicazione ufficiale disponibile, del giugno 2025). Il prossimo aggiornamento COVIP è atteso a giugno 2026.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Nessuna consulenza finanziaria.</strong> Questa pagina è uno strumento informativo e comparativo basato su dati pubblici. Non costituisce consulenza finanziaria, fiscale o previdenziale personalizzata ai sensi del D.Lgs. 58/1998 (TUF) e del D.Lgs. 252/2005. SoldiBuoni non è iscritto all'albo dei consulenti finanziari e non fornisce raccomandazioni di investimento. La scelta del fondo pensione dipende da variabili individuali (età, orizzonte temporale, profilo di rischio, reddito, CCNL, situazione familiare) che solo un consulente abilitato può valutare compiutamente.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>I rendimenti passati non sono indicativi di quelli futuri.</strong> I dati storici COVIP mostrano il comportamento di un comparto in condizioni di mercato passate e non garantiscono risultati analoghi in futuro. Un fondo pensione è un investimento di lungo periodo soggetto a volatilità di mercato, rischio di cambio e rischio emittente.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Prima di aderire a qualsiasi fondo pensione</strong>, consulta la Scheda dei Costi, il Documento sul Regime Fiscale e la Nota Informativa pubblicati dal fondo e vigilati dalla COVIP. Per decisioni importanti rivolgiti a un consulente finanziario abilitato (iscritto OCF) o a un professionista del settore previdenziale.
        </p>
      </div>

      {/* Animazioni */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />

    </div>
  );
}