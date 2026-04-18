import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════
// DATI UFFICIALI COVIP — Fondi Pensione Aperti — Rendimenti al 31/12/2024
// ═══════════════════════════════════════════════════════════════════
const COVIP_DATA = [{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":-0.66,"r3":-4.09,"r5":-2.51,"r10":-0.9,"r20":0.54},{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"BILANCIATO","cat":"Bilanciato","r1":4.81,"r3":-1.22,"r5":0.78,"r10":1.37,"r20":2.29},{"s":"ALLEANZA ASSICURAZIONI","f":"ALMEGLIO  ALLEANZA","c":"AZIONARIO","cat":"Azionario","r1":10.43,"r3":1.41,"r5":4.23,"r10":3.87,"r20":3.29},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA FLESSIBILE","cat":"Obb. Puro","r1":1.62,"r3":-3.25,"r5":-1.8,"r10":-0.02,"r20":1.66},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA BILANCIATA","cat":"Bilanciato","r1":7.57,"r3":-0.31,"r5":1.79,"r10":2.46,"r20":3.25},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA AZIONARIA","cat":"Azionario","r1":16.18,"r3":4.17,"r5":6.95,"r10":5.95,"r20":5.07},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA OBBLIGAZIONARIA BREVE TERMINE","cat":"Obb. Puro","r1":2.2,"r3":-0.01,"r5":-0.34,"r10":null,"r20":null},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA OBBLIGAZIONARIA LUNGO TERMINE","cat":"Obb. Puro","r1":1.69,"r3":-1.73,"r5":-1.33,"r10":null,"r20":null},{"s":"ALLIANZ","f":"ALLIANZ PREVIDENZA","c":"LINEA MULTIASSET","cat":"Bilanciato","r1":4.66,"r3":-0.83,"r5":0.45,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA FLESSIBILE","cat":"Obb. Puro","r1":1.95,"r3":-2.9,"r5":-1.4,"r10":0.15,"r20":1.05},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA","cat":"Obb. Misto","r1":3.83,"r3":-0.2,"r5":0.32,"r10":0.64,"r20":1.93},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA BILANCIATA","cat":"Azionario","r1":10.29,"r3":2.27,"r5":3.99,"r10":3.69,"r20":3.99},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA AZIONARIA","cat":"Azionario","r1":17.67,"r3":4.99,"r5":7.9,"r10":6.85,"r20":5.9},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA BREVE TERMINE","cat":"Obb. Puro","r1":2.6,"r3":0.28,"r5":-0.05,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA OBBLIGAZIONARIA LUNGO TERMINE","cat":"Obb. Puro","r1":2.22,"r3":-1.36,"r5":-0.92,"r10":null,"r20":null},{"s":"ALLIANZ","f":"INSIEME","c":"LINEA MULTIASSET","cat":"Bilanciato","r1":5.32,"r3":-0.18,"r5":0.98,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"PRUDENTE ESG","cat":"Obb. Misto","r1":3.32,"r3":-0.04,"r5":0.65,"r10":0.9,"r20":1.71},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"BILANCIATA ESG","cat":"Bilanciato","r1":2.97,"r3":-1.45,"r5":1.27,"r10":2.25,"r20":3.19},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"SVILUPPO ESG","cat":"Bilanciato","r1":3.94,"r3":-0.52,"r5":2.7,"r10":3.48,"r20":3.85},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"ESPANSIONE ESG","cat":"Azionario","r1":5.25,"r3":1.27,"r5":5.02,"r10":5.12,"r20":4.51},{"s":"AMUNDI SGR","f":"SECONDAPENSIONE","c":"GARANTITA ESG","cat":"Bilanciato","r1":2.43,"r3":0.28,"r5":0.18,"r10":0.48,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"OBBLIGAZIONARIO MISTO 25% ESG","cat":"Obb. Misto","r1":2.3,"r3":-1.88,"r5":0.44,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"BILANCIATO 50% ESG","cat":"Bilanciato","r1":3.63,"r3":-0.68,"r5":2.4,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"AZIONARIO 75% ESG","cat":"Azionario","r1":4.33,"r3":-0.2,"r5":3.67,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"AZIONARIO PLUS 90% ESG","cat":"Azionario","r1":5.11,"r3":0.55,"r5":4.76,"r10":null,"r20":null},{"s":"AMUNDI SGR","f":"CORE PENSION","c":"GARANTITO ESG","cat":"Obb. Misto","r1":2.36,"r3":0.27,"r5":-0.05,"r10":null,"r20":null},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"CRESCITA 25+","cat":"Azionario","r1":13.66,"r3":3.69,"r5":6.79,"r10":6.0,"r20":5.52},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"RIVALUTAZIONE 10+","cat":"Bilanciato","r1":7.44,"r3":0.04,"r5":2.3,"r10":2.76,"r20":3.71},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"CONSERVAZIONE 3+","cat":"Obb. Puro","r1":2.55,"r3":-1.28,"r5":-0.87,"r10":0.05,"r20":1.27},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"GARANZIA 1+","cat":"Obb. Puro","r1":2.76,"r3":1.35,"r5":0.55,"r10":0.06,"r20":0.64},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"INCREMENTO E GARANZIA 5+","cat":"Bilanciato","r1":3.77,"r3":0.76,"r5":1.05,"r10":1.45,"r20":null},{"s":"ANIMA SGR","f":"ARTI E MESTIERI","c":"EQUILIBRIO 5+","cat":"Bilanciato","r1":5.15,"r3":-0.76,"r5":0.37,"r10":1.25,"r20":null},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"RENDITA SOSTENIBILE","cat":"Bilanciato","r1":5.34,"r3":0.05,"r5":1.21,"r10":1.6,"r20":2.85},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"CRESCITA SOSTENIBILE","cat":"Bilanciato","r1":7.91,"r3":0.3,"r5":2.55,"r10":2.7,"r20":3.2},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"ALTA CRESCITA SOSTENIBILE","cat":"Bilanciato","r1":11.74,"r3":2.52,"r5":5.3,"r10":4.2,"r20":3.74},{"s":"ARCA FONDI SGR","f":"ARCA PREVIDENZA","c":"OBIETTIVO TFR","cat":"Obb. Misto","r1":4.17,"r3":1.64,"r5":1.12,"r10":0.6,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"PRUDENTE","cat":"Obb. Puro","r1":2.21,"r3":-1.03,"r5":-0.82,"r10":-0.2,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"EQUILIBRATA","cat":"Bilanciato","r1":6.46,"r3":1.39,"r5":2.6,"r10":2.5,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"DINAMICA","cat":"Azionario","r1":8.44,"r3":1.83,"r5":4.39,"r10":3.97,"r20":null},{"s":"ASSIMOCO VITA","f":"IL MELOGRANO","c":"GARANTITA","cat":"Obb. Misto","r1":3.24,"r3":-0.6,"r5":-0.03,"r10":0.37,"r20":null},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"MONETA","cat":"Obb. Puro","r1":1.92,"r3":-1.07,"r5":-0.52,"r10":-0.01,"r20":1.02},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"STABILITÀ","cat":"Bilanciato","r1":5.81,"r3":0.58,"r5":1.95,"r10":2.24,"r20":2.81},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"MISTA","cat":"Bilanciato","r1":8.5,"r3":1.05,"r5":3.32,"r10":3.62,"r20":3.84},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"CRESCITA","cat":"Azionario","r1":11.57,"r3":2.34,"r5":5.08,"r10":4.95,"r20":4.72},{"s":"AXA MPS ASSICURAZIONI VITA","f":"PREVIDENZA PER TE","c":"GARANTITA","cat":"Obb. Misto","r1":2.58,"r3":-0.1,"r5":-0.05,"r10":-0.19,"r20":0.37},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"EQUILIBRATO","cat":"Bilanciato","r1":6.41,"r3":1.31,"r5":2.47,"r10":2.58,"r20":2.41},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"CRESCITA","cat":"Azionario","r1":9.71,"r3":1.96,"r5":3.96,"r10":2.86,"r20":2.82},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT PREVIDENZA","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":2.53,"r3":0.07,"r5":0.74,"r10":1.17,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO CONSERVATIVO","cat":"Bilanciato","r1":3.7,"r3":0.16,"r5":null,"r10":null,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO","cat":"Bilanciato","r1":4.57,"r3":0.38,"r5":null,"r10":null,"r20":null},{"s":"AZIMUT CAPITAL MANAGEMENT SGR","f":"AZIMUT SUSTAINABLE FUTURE","c":"BILANCIATO ACCRESCITIVO","cat":"Bilanciato","r1":5.37,"r3":0.41,"r5":null,"r10":null,"r20":null},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"OBBLIGAZIONARIO ESG","cat":"Obb. Misto","r1":1.1,"r3":-1.9,"r5":-1.28,"r10":-0.39,"r20":0.87},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"BILANCIATO ESG","cat":"Bilanciato","r1":7.85,"r3":1.07,"r5":2.77,"r10":2.83,"r20":3.28},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"AZIONARIO ESG","cat":"Azionario","r1":14.76,"r3":4.22,"r5":6.37,"r10":5.43,"r20":4.66},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"PRUDENTE  ESG","cat":"Obb. Puro","r1":2.23,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"BCC RISPARMIO & PREVIDENZA","f":"AUREO","c":"GARANTITO  ESG","cat":"Obb. Puro","r1":2.8,"r3":1.44,"r5":0.59,"r10":0.1,"r20":null},{"s":"BIM VITA","f":"BIM VITA","c":"BOND","cat":"Obb. Misto","r1":2.31,"r3":-1.11,"r5":-0.73,"r10":-0.24,"r20":1.73},{"s":"BIM VITA","f":"BIM VITA","c":"EQUILIBRIO","cat":"Bilanciato","r1":4.67,"r3":0.2,"r5":0.5,"r10":0.78,"r20":1.98},{"s":"BIM VITA","f":"BIM VITA","c":"BILANCIATA  GLOBALE","cat":"Bilanciato","r1":10.05,"r3":5.14,"r5":4.63,"r10":3.37,"r20":2.99},{"s":"BIM VITA","f":"BIM VITA","c":"EQUITY","cat":"Azionario","r1":15.8,"r3":8.52,"r5":7.25,"r10":5.02,"r20":4.08},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"SAFE","cat":"Obb. Puro","r1":0.98,"r3":-2.96,"r5":-1.92,"r10":-0.63,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"ACTIVITY","cat":"Bilanciato","r1":2.65,"r3":-1.84,"r5":0.03,"r10":1.29,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"DYNAMIC","cat":"Bilanciato","r1":5.3,"r3":1.23,"r5":3.14,"r10":3.42,"r20":null},{"s":"CASSA CENTRALE RAIFFEISEN DELL’ALTO ADIGE","f":"RAIFFEISEN","c":"GUARANTY","cat":"Obb. Misto","r1":2.31,"r3":0.56,"r5":0.25,"r10":null,"r20":null},{"s":"CNP VITA ASSICURA","f":"CNP","c":"AZIONARIO","cat":"Azionario","r1":6.36,"r3":1.23,"r5":3.55,"r10":3.82,"r20":3.98},{"s":"CNP VITA ASSICURA","f":"CNP","c":"BILANCIATO","cat":"Bilanciato","r1":3.24,"r3":-1.13,"r5":0.89,"r10":1.72,"r20":2.95},{"s":"CNP VITA ASSICURA","f":"CNP","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":2.2,"r3":-2.04,"r5":-0.25,"r10":0.83,"r20":2.45},{"s":"CNP VITA ASSICURA","f":"CNP","c":"GARANZIA RESTITUZIONE CAPITALE","cat":"Obb. Misto","r1":2.31,"r3":-0.31,"r5":0.31,"r10":0.74,"r20":2.23},{"s":"CNP VITA ASSICURA","f":"CNP","c":"GARANZIA DI RENDIMENTO MIN.","cat":"Obb. Misto","r1":2.19,"r3":-0.46,"r5":0.21,"r10":0.49,"r20":1.87},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"OBBLIGAZIONARIO GARANTITO","cat":"Obb. Misto","r1":4.79,"r3":-0.97,"r5":0.25,"r10":1.1,"r20":2.3},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"FLESSIBILE","cat":"Obb. Misto","r1":2.98,"r3":0.56,"r5":1.43,"r10":1.66,"r20":1.81},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"BILANCIATO","cat":"Bilanciato","r1":7.36,"r3":1.33,"r5":2.75,"r10":3.23,"r20":3.39},{"s":"CREDEMVITA","f":"CREDEMPREVIDENZA","c":"AZIONARIO","cat":"Azionario","r1":11.86,"r3":4.82,"r5":5.96,"r10":5.42,"r20":4.58},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA GARANTITA","cat":"Bilanciato","r1":1.97,"r3":-0.76,"r5":0.04,"r10":0.79,"r20":null},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA MODERATA","cat":"Bilanciato","r1":7.13,"r3":-0.47,"r5":2.49,"r10":3.35,"r20":4.03},{"s":"CREDIT AGRICOLE VITA","f":"CREDIT AGRICOLE VITA","c":"LINEA DINAMICA","cat":"Azionario","r1":10.75,"r3":2.84,"r5":5.75,"r10":5.49,"r20":5.47},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE HIGH GROWTH","cat":"Azionario","r1":2.85,"r3":-0.52,"r5":2.32,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE GROWTH","cat":"Bilanciato","r1":2.57,"r3":-0.88,"r5":1.33,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE BALANCED GROWTH","cat":"Obb. Misto","r1":2.16,"r3":-1.43,"r5":0.31,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE CONSERVATIVE","cat":"Obb. Misto","r1":1.82,"r3":-1.92,"r5":-0.75,"r10":null,"r20":null},{"s":"EUREGIO PLUS SGR","f":"PENSPLAN PROFI","c":"ETHICAL LIFE SHORT TERM","cat":"Obb. Puro","r1":2.57,"r3":0.7,"r5":0.22,"r10":null,"r20":null},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"SICUREZZA","cat":"Obb. Puro","r1":2.01,"r3":-2.82,"r5":-1.61,"r10":-0.22,"r20":1.57},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"EQUILIBRIO","cat":"Bilanciato","r1":5.23,"r3":-1.06,"r5":0.86,"r10":1.72,"r20":2.69},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"VALORE","cat":"Azionario","r1":8.41,"r3":0.37,"r5":2.98,"r10":3.25,"r20":3.33},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"CRESCITA","cat":"Azionario","r1":10.47,"r3":1.62,"r5":4.69,"r10":4.44,"r20":3.77},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"GARANZIA","cat":"Obb. Puro","r1":2.14,"r3":0.56,"r5":-0.08,"r10":-0.47,"r20":0.41},{"s":"FIDEURAM VITA","f":"FONDO PENSIONE FIDEURAM","c":"MILLENIALS","cat":"Azionario","r1":16.61,"r3":2.83,"r5":null,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":1.75,"r3":-2.43,"r5":-0.97,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"MULTIASSET","cat":"Bilanciato","r1":4.51,"r3":0.69,"r5":0.5,"r10":1.05,"r20":2.66},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"AZIONARIO GLOBALE","cat":"Azionario","r1":9.67,"r3":3.42,"r5":5.07,"r10":4.45,"r20":4.28},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"OBBLIGAZIONARIO BREVE TERMINE","cat":"Obb. Puro","r1":2.24,"r3":-0.14,"r5":-0.24,"r10":null,"r20":null},{"s":"GENERALI ITALIA","f":"GENERALI GLOBAL","c":"REAL RETURN","cat":"Obb. Misto","r1":2.99,"r3":0.45,"r5":0.53,"r10":null,"r20":null},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"NUOVO OBBLIGAZIONARIO ETICO","cat":"Obb. Misto","r1":2.51,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"BILANCIATO ETICO","cat":"Bilanciato","r1":6.35,"r3":-0.11,"r5":1.67,"r10":2.26,"r20":2.64},{"s":"GROUPAMA ASSICURAZIONI","f":"PROGRAMMA OPEN","c":"PREVALENTEMENTE AZIONARIO ETICO","cat":"Azionario","r1":8.44,"r3":1.58,"r5":3.62,"r10":3.79,"r20":3.66},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"PRUDENTE","cat":"Obb. Puro","r1":3.32,"r3":-0.49,"r5":-0.01,"r10":0.88,"r20":2.18},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"EQUILIBRATA","cat":"Bilanciato","r1":4.79,"r3":0.24,"r5":1.78,"r10":2.67,"r20":3.48},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"DINAMICA","cat":"Azionario","r1":6.52,"r3":1.67,"r5":4.3,"r10":5.12,"r20":3.73},{"s":"HDI ASSICURAZIONI","f":"AZIONE DI PREVIDENZA","c":"GARANTITA","cat":"Obb. Puro","r1":3.44,"r3":-0.46,"r5":0.37,"r10":1.23,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 1 GARANTITA","cat":"Obb. Misto","r1":2.35,"r3":-0.41,"r5":-0.38,"r10":-0.37,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 2 PRUDENTE","cat":"Bilanciato","r1":4.3,"r3":-1.29,"r5":-0.3,"r10":0.5,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 3 EQUILIBRATA","cat":"Bilanciato","r1":6.46,"r3":-0.05,"r5":1.18,"r10":1.72,"r20":null},{"s":"HELVETIA VITA","f":"SOLUZIONE PREVIDENTE","c":"LINEA 4 DINAMICA","cat":"Azionario","r1":9.16,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"TFR+","cat":"Bilanciato","r1":3.08,"r3":0.27,"r5":0.51,"r10":0.23,"r20":1.19},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"CRESCITA PRUDENTE","cat":"Obb. Misto","r1":2.36,"r3":-0.87,"r5":-0.4,"r10":0.28,"r20":1.47},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"CRESCITA DINAMICA","cat":"Obb. Misto","r1":2.94,"r3":-0.93,"r5":0.14,"r10":0.84,"r20":1.94},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"ACCUMULAZIONE BILANCIATA","cat":"Bilanciato","r1":6.9,"r3":0.88,"r5":2.91,"r10":3.0,"r20":3.47},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"PREVID-SYSTEM","c":"RIVALUTAZIONE AZIONARIA","cat":"Azionario","r1":11.71,"r3":2.94,"r5":5.73,"r10":5.03,"r20":4.69},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"MONETARIA","cat":"Obb. Puro","r1":2.47,"r3":0.29,"r5":0.01,"r10":-0.08,"r20":1.02},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"TFR+","cat":"Bilanciato","r1":3.04,"r3":0.41,"r5":0.63,"r10":0.33,"r20":1.39},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"BILANCIATA","cat":"Bilanciato","r1":9.09,"r3":0.8,"r5":3.2,"r10":3.49,"r20":4.05},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"AZIONARIA","cat":"Azionario","r1":13.76,"r3":3.24,"r5":6.33,"r10":5.62,"r20":5.37},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"GIUSTINIANO","c":"OBBLIGAZIONARIA","cat":"Obb. Puro","r1":1.22,"r3":-3.6,"r5":-2.0,"r10":-0.18,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA BREVE TERMINE","cat":"Obb. Misto","r1":2.56,"r3":0.77,"r5":0.41,"r10":0.01,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA TFR","cat":"Bilanciato","r1":2.93,"r3":0.21,"r5":0.39,"r10":0.02,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA MEDIO TERMINE","cat":"Bilanciato","r1":5.6,"r3":1.18,"r5":1.73,"r10":1.53,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA LUNGO TERMINE","cat":"Bilanciato","r1":8.69,"r3":2.73,"r5":3.93,"r10":3.37,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA BREVE TERMINE ESG","cat":"Obb. Misto","r1":2.86,"r3":-1.43,"r5":-0.55,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA MEDIO TERMINE ESG","cat":"Bilanciato","r1":5.95,"r3":-0.16,"r5":1.47,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"IL MIO DOMANI","c":"LINEA LUNGO TERMINE ESG","cat":"Azionario","r1":8.0,"r3":0.8,"r5":2.79,"r10":null,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"CAPITALE SICURO","cat":"Obb. Misto","r1":2.99,"r3":-0.09,"r5":0.11,"r10":0.11,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"GARANTITO","cat":"Obb. Puro","r1":1.95,"r3":-0.54,"r5":-0.68,"r10":-0.53,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"PRUDENTE","cat":"Obb. Misto","r1":2.78,"r3":-1.14,"r5":-0.31,"r10":0.47,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"MODERATO","cat":"Bilanciato","r1":4.21,"r3":-0.31,"r5":0.8,"r10":1.44,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"DINAMICO","cat":"Bilanciato","r1":5.92,"r3":1.06,"r5":2.7,"r10":2.85,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"UBI PREVIDENZA","c":"AGGRESSIVO","cat":"Bilanciato","r1":8.54,"r3":2.84,"r5":4.62,"r10":4.16,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"TFR","cat":"Obb. Misto","r1":1.59,"r3":-1.33,"r5":-0.61,"r10":-0.41,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"EQUILIBRIO","cat":"Bilanciato","r1":4.02,"r3":0.01,"r5":1.13,"r10":0.93,"r20":null},{"s":"INTESA SANPAOLO ASSICURAZIONI","f":"BAP PENSIONE 2007","c":"INVESTIMENTO","cat":"Azionario","r1":7.36,"r3":1.82,"r5":3.94,"r10":3.1,"r20":null},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"ACTIVITAS","cat":"Azionario","r1":8.04,"r3":2.55,"r5":4.33,"r10":3.97,"r20":3.58},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SOLIDITAS","cat":"Bilanciato","r1":6.34,"r3":1.46,"r5":2.93,"r10":2.99,"r20":3.14},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"AEQUITAS","cat":"Bilanciato","r1":2.55,"r3":-1.05,"r5":0.83,"r10":1.64,"r20":null},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SERENITAS","cat":"Obb. Misto","r1":3.12,"r3":-1.04,"r5":-0.06,"r10":0.77,"r20":2.12},{"s":"ITAS VITA","f":"PLURIFONDS ITAS VITA","c":"SECURITAS","cat":"Obb. Misto","r1":2.82,"r3":-1.38,"r5":-0.98,"r10":0.06,"r20":1.38},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":1.39,"r3":-2.53,"r5":-1.07,"r10":-0.39,"r20":2.3},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"BILANCIATO","cat":"Bilanciato","r1":7.02,"r3":0.56,"r5":2.69,"r10":2.2,"r20":3.78},{"s":"MEDIOLANUM GESTIONE FONDI SGR P.A","f":"PREVIGEST FUND MEDIOLANUM","c":"AZIONARIO","cat":"Azionario","r1":11.41,"r3":2.57,"r5":5.24,"r10":4.25,"r20":4.93},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"OBBLIGAZIONARIO GARANTITO","cat":"Obb. Puro","r1":3.17,"r3":0.75,"r5":1.13,"r10":0.68,"r20":1.2},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"OBBLIGAZIONARIO","cat":"Obb. Puro","r1":1.79,"r3":-1.38,"r5":-0.18,"r10":0.53,"r20":1.71},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"BILANCIATO","cat":"Bilanciato","r1":2.4,"r3":-0.47,"r5":1.8,"r10":2.0,"r20":2.71},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"AZIONARIO EUROPA","cat":"Azionario","r1":5.45,"r3":2.71,"r5":5.05,"r10":4.42,"r20":4.24},{"s":"SELLA SGR","f":"EURORISPARMIO","c":"AZIONARIO INTERNAZIONALE","cat":"Azionario","r1":11.17,"r3":3.63,"r5":6.54,"r10":5.52,"r20":5.1},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"GARANTITA ETICA","cat":"Obb. Puro","r1":2.95,"r3":0.82,"r5":0.37,"r10":0.45,"r20":1.31},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"PRUDENZIALE ETICA","cat":"Obb. Puro","r1":1.14,"r3":-3.76,"r5":-2.35,"r10":-0.44,"r20":1.56},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"BILANCIATA ETICA","cat":"Bilanciato","r1":3.32,"r3":-1.04,"r5":0.73,"r10":1.54,"r20":2.62},{"s":"SOCIETA' REALE MUTUA DI ASSICURAZIONI","f":"TESEO","c":"SVILUPPO ETICA","cat":"Azionario","r1":6.43,"r3":2.72,"r5":4.67,"r10":4.01,"r20":3.06},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"SICURA - OBBLIGAZIONARIA CON GARANZIA DI RENDIMENTO MINIMO","cat":"Obb. Puro","r1":3.1,"r3":-0.87,"r5":-0.37,"r10":-0.11,"r20":0.71},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"TRANQUILLA - OBBLIGAZIONARIA MISTA CON GARANZIA DI RESTITUZIONE DEL CAPITALE","cat":"Obb. Misto","r1":1.2,"r3":-3.87,"r5":-2.13,"r10":-0.34,"r20":1.64},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"SERENA - BILANCIATA","cat":"Bilanciato","r1":4.4,"r3":-1.61,"r5":0.86,"r10":1.72,"r20":2.96},{"s":"UNICREDIT ALLIANZ VITA","f":"UNICREDIT","c":"DINAMICA - AZIONARIA INTERNAZIONALE","cat":"Azionario","r1":6.78,"r3":2.07,"r5":4.94,"r10":4.66,"r20":4.06},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"OBBLIGAZIONARIO","cat":"Obb. Misto","r1":2.66,"r3":-0.39,"r5":-0.04,"r10":0.38,"r20":2.05},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO PRUDENTE","cat":"Obb. Misto","r1":3.4,"r3":-0.75,"r5":0.21,"r10":1.02,"r20":2.49},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO EQUILIBRATO","cat":"Bilanciato","r1":4.95,"r3":-0.17,"r5":1.21,"r10":1.96,"r20":3.04},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO DINAMICO","cat":"Bilanciato","r1":6.91,"r3":0.92,"r5":2.62,"r10":3.06,"r20":3.61},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"GARANTITO FLEX","cat":"Bilanciato","r1":3.41,"r3":0.64,"r5":0.86,"r10":null,"r20":null},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"BILANCIATO ETICO","cat":"Obb. Misto","r1":3.56,"r3":-0.11,"r5":0.32,"r10":null,"r20":null},{"s":"UNIPOL ASSICURAZIONI","f":"UNIPOL PREVIDENZA FPA","c":"AZIONARIO","cat":"Azionario","r1":8.68,"r3":2.38,"r5":4.33,"r10":null,"r20":null},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-BOND","cat":"Obb. Puro","r1":0.79,"r3":-3.04,"r5":-1.97,"r10":-1.01,"r20":1.26},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-GEST","cat":"Bilanciato","r1":1.56,"r3":-2.0,"r5":-0.78,"r10":0.05,"r20":1.76},{"s":"VERA VITA","f":"VERA VITA","c":"POPOLARE-MIX","cat":"Bilanciato","r1":4.15,"r3":0.82,"r5":1.96,"r10":2.5,"r20":3.31},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA GARANTITA","cat":"Obb. Misto","r1":1.59,"r3":-2.61,"r5":-1.23,"r10":-0.08,"r20":1.44},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA EQUILIBRATA","cat":"Bilanciato","r1":2.19,"r3":-1.09,"r5":0.54,"r10":1.43,"r20":2.45},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA BILANCIATO INTERNAZIONALE","cat":"Bilanciato","r1":6.63,"r3":null,"r5":null,"r10":null,"r20":null},{"s":"VITTORIA ASSICURAZIONI","f":"VITTORIA FORMULA LAVORO","c":"PREVIDENZA CAPITALIZZATA","cat":"Azionario","r1":4.17,"r3":0.78,"r5":2.63,"r10":3.24,"r20":3.0},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"GARANTITA","cat":"Obb. Puro","r1":1.31,"r3":-1.54,"r5":-1.16,"r10":-0.24,"r20":0.97},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"CONSERVATIVA","cat":"Obb. Puro","r1":1.13,"r3":-3.27,"r5":-2.12,"r10":-0.33,"r20":1.01},{"s":"ZURICH INVESTMENTS LIFE","f":"ZURICH CONTRIBUTION","c":"DINAMICA","cat":"Azionario","r1":6.38,"r3":0.98,"r5":2.9,"r10":3.54,"r20":3.56},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"BILANCIATA 65","cat":"Azionario","r1":6.03,"r3":0.57,"r5":2.47,"r10":3.14,"r20":3.35},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"BILANCIATA 30","cat":"Bilanciato","r1":3.61,"r3":-1.24,"r5":0.24,"r10":1.51,"r20":2.42},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"OBBLIGAZIONARIA","cat":"Obb. Puro","r1":1.29,"r3":-3.15,"r5":-2.05,"r10":-0.12,"r20":1.33},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"GARANTITA","cat":"Obb. Misto","r1":0.62,"r3":-2.21,"r5":-1.85,"r10":-1.04,"r20":0.2},{"s":"ZURICH INVESTMENTS LIFE","f":"ZED OMNIFUND","c":"AZIONARIA","cat":"Azionario","r1":7.92,"r3":2.3,"r5":4.22,"r10":4.24,"r20":3.68}];

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const CATEGORIES = [
  { id: 'tutti', label: 'Tutti', icon: '📊' },
  { id: 'Azionario', label: 'Azionario', icon: '📈' },
  { id: 'Bilanciato', label: 'Bilanciato', icon: '⚖️' },
  { id: 'Obb. Misto', label: 'Obb. Misto', icon: '🔄' },
  { id: 'Obb. Puro', label: 'Obb. Puro', icon: '🛡️' },
];

const HORIZONS = [
  { key: 'r1', label: '1 Anno', sub: '2024' },
  { key: 'r3', label: '3 Anni', sub: '2022-2024' },
  { key: 'r5', label: '5 Anni', sub: '2020-2024' },
  { key: 'r10', label: '10 Anni', sub: '2015-2024' },
  { key: 'r20', label: '20 Anni', sub: '2005-2024' },
];

function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .pension-container { max-width: 860px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .pension-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.5px; }
      .pension-subtitle { font-size: 14px; color: #64748b; margin-bottom: 28px; }
      .glass-panel { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); border-radius: 24px; padding: 24px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 20px; }
      .search-input { width: 100%; padding: 14px 20px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); background: #f8fafc; font-size: 15px; outline: none; transition: all 0.3s; box-sizing: border-box; }
      .search-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.1); }
      .cat-btn { padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(0,0,0,0.06); font-size: 13px; font-weight: 600; background: #fff; color: #64748b; cursor: pointer; transition: all 0.3s ${EASE}; white-space: nowrap; }
      .cat-btn:hover { background: #f8fafc; transform: translateY(-1px); }
      .cat-btn.active { background: #14b8a6; color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(20,184,166,0.3); }
      .hz-btn { padding: 10px 16px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); font-size: 13px; font-weight: 700; background: #fff; color: #64748b; cursor: pointer; transition: all 0.3s ${EASE}; flex: 1; text-align: center; }
      .hz-btn:hover { background: #f8fafc; }
      .hz-btn.active { background: #0f172a; color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
      .hz-btn .hz-sub { font-size: 10px; font-weight: 500; opacity: 0.7; display: block; margin-top: 2px; }
      .fund-card { background: #fff; border-radius: 20px; padding: 20px 24px; margin-bottom: 12px; border: 1px solid rgba(0,0,0,0.04); transition: all 0.4s ${EASE}; }
      .fund-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px -8px rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.08); }
      .rend-pill { display: inline-block; padding: 4px 12px; border-radius: 10px; font-size: 14px; font-weight: 800; }
      .rend-positive { background: #dcfce7; color: #166534; }
      .rend-negative { background: #fee2e2; color: #991b1b; }
      .rend-null { background: #f1f5f9; color: #94a3b8; }
      .cat-badge { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .cat-azn { background: #ede9fe; color: #5b21b6; }
      .cat-bil { background: #dbeafe; color: #1e40af; }
      .cat-obb-m { background: #fef3c7; color: #92400e; }
      .cat-obb-p { background: #e0e7ff; color: #3730a3; }
      .disclaimer-box { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 16px; padding: 16px 20px; margin-bottom: 28px; font-size: 12px; color: #92400e; line-height: 1.6; }
      .results-count { font-size: 14px; color: #94a3b8; font-weight: 600; margin-bottom: 16px; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .fund-card { animation: fadeIn 0.4s ${EASE} both; }
    `}} />
  );
}

function RendPill({ value }) {
  if (value === null || value === undefined) return <span className="rend-pill rend-null">N/D</span>;
  const cls = value >= 0 ? 'rend-positive' : 'rend-negative';
  return <span className={`rend-pill ${cls}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

function CatBadge({ cat }) {
  const cls = cat === 'Azionario' ? 'cat-azn' : cat === 'Bilanciato' ? 'cat-bil' : cat.includes('Misto') ? 'cat-obb-m' : 'cat-obb-p';
  return <span className={`cat-badge ${cls}`}>{cat}</span>;
}

export function PensioneComp({ color = '#14b8a6' }) {
  const [categoria, setCategoria] = useState('tutti');
  const [horizon, setHorizon] = useState('r5');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

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
    
    data = data.filter(d => d[horizon] !== null && d[horizon] !== undefined);
    data.sort((a, b) => (b[horizon] || -999) - (a[horizon] || -999));
    
    return data;
  }, [categoria, horizon, search]);

  const displayed = showAll ? filtered : filtered.slice(0, 20);
  const activeHz = HORIZONS.find(h => h.key === horizon);

  return (
    <div className="pension-container">
      <StyleInjector />
      
      <h2 className="pension-title">Comparatore Fondi Pensione Aperti</h2>
      <p className="pension-subtitle">Dati ufficiali COVIP — Rendimenti netti al 31/12/2024</p>

      <div className="disclaimer-box">
        ⚠️ <strong>Fonte: COVIP</strong> — I rendimenti passati non sono indicativi di quelli futuri. Dati netti da costi di gestione e imposte. 
        Non costituisce consulenza finanziaria. Consulta un professionista prima di aderire a un fondo pensione.
        <br/>Ultimo aggiornamento dati: <strong>31 dicembre 2024</strong> — Pubblicazione COVIP giugno 2025.
      </div>

      <div className="glass-panel">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Cerca per società, fondo o comparto..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShowAll(false); }}
        />

        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 10 }}>Categoria di investimento:</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`cat-btn ${categoria === cat.id ? 'active' : ''}`}
                onClick={() => { setCategoria(cat.id); setShowAll(false); }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 10 }}>Ordina per rendimento medio annuo:</label>
          {/* FIX MOBILE: Aggiunto flexWrap: 'wrap' per non far sbordare il pulsante '20 Anni' */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {HORIZONS.map(hz => (
              <button
                key={hz.key}
                className={`hz-btn ${horizon === hz.key ? 'active' : ''}`}
                onClick={() => { setHorizon(hz.key); setShowAll(false); }}
              >
                {hz.label}
                <span className="hz-sub">{hz.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-count">
        {filtered.length} comparti trovati {categoria !== 'tutti' && `in "${categoria}"`} — ordinati per rendimento {activeHz?.label}
      </div>

      {displayed.map((d, i) => (
        <div key={`${d.f}-${d.c}-${i}`} className="fund-card" style={{ animationDelay: `${i * 0.03}s` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{d.f}</span>
                {i === 0 && <span style={{ background: '#14b8a6', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 8, textTransform: 'uppercase' }}>🏆 Top</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.s}</span>
                <span style={{ color: '#e2e8f0' }}>•</span>
                <CatBadge cat={d.cat} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Comparto: {d.c}</div>
            </div>
            
            {/* FIX MOBILE: Reso flex in orizzontale e rimosso il marginBottom per ridurre lo spazio e pareggiare le schede */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', width: '100%', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Rend. {activeHz?.label}</div>
              <RendPill value={d[horizon]} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HORIZONS.map(hz => (
              <div key={hz.key} style={{ flex: 1, minWidth: 70, textAlign: 'center', padding: '8px 4px', background: horizon === hz.key ? '#f0fdfa' : '#f8fafc', borderRadius: 10, border: horizon === hz.key ? '1px solid #14b8a6' : '1px solid transparent' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{hz.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d[hz.key] === null ? '#cbd5e1' : d[hz.key] >= 0 ? '#059669' : '#dc2626' }}>
                  {d[hz.key] !== null ? `${d[hz.key] > 0 ? '+' : ''}${d[hz.key].toFixed(1)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!showAll && filtered.length > 20 && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => setShowAll(true)}
            style={{ padding: '14px 32px', borderRadius: 16, border: '2px solid #14b8a6', background: '#fff', color: '#14b8a6', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: `all 0.3s ${EASE}` }}
          >
            Mostra tutti i {filtered.length} comparti →
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Nessun fondo trovato con questi filtri</div>
        </div>
      )}
    </div>
  );
}