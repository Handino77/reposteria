/**
 * tablasConversion.js
 * Tablas y datos de conversión portados del HTML original (cifu_pasticceria).
 * NO modificar ni abreviar los valores de densidad o textos.
 */

export const densidadTazas = {
  'Aceite': 180,
  'Almendra molida': 120,
  'Almidón de maíz (Maicena)': 110,
  'Maicena': 110,
  'Arroz': 300,
  'Azúcar': 250,
  'Azúcar granulada': 250,
  'Azúcar glass': 115,
  'Azúcar flor': 115,
  'Azúcar moreno': 215,
  'Azúcar rubia (apretada)': 215,
  'Azúcar moscobado': 170,
  'Azúcar de coco': 200,
  'Cacao en polvo': 85,
  'Chips de chocolate': 180,
  'Pepitas de chocolate': 180,
  'Coco rallado': 80,
  'Copos de avena': 85,
  'Avena': 85,
  'Dátiles': 150,
  'Frutos secos (nueces, avellanas, cacahuetes)': 100,
  'Nueces picadas': 100,
  'Garbanzos, judías blancas/pintas, soja': 200,
  'Harina de arroz': 160,
  'Harina de trigo': 125,
  'Harina (cernida)': 125,
  'Harina de avena': 90,
  'Harina de coco': 90,
  'Harina de garbanzos': 190,
  'Harina integral': 120,
  'Harina de almendras': 120,
  'Leche': 250,
  'Lentejas': 180,
  'Mantequilla': 225,
  'Mantequilla de cacahuete': 250,
  'Melaza': 280,
  'Mermelada': 330,
  'Miel': 300,
  'Nata o crema de leche': 250,
  'Puré de calabaza': 210,
  'Sirope de ágave': 100,
  'Stevia': 200,
  'Yogur': 225,
  'Yogur griego': 280,
  'Zanahoria rallada': 135
}

export const cucharasGramos = {
  tbsp: {
    'Harina': 7,
    'Sal': 19,
    'Azúcar': 10,
    'Levadura en polvo': 10,
    'Aceite': 8,
    'Mantequilla derretida': 14,
    'Cacao en polvo': 6,
    'Miel': 21,
    'Leche': 15,
    'Agua': 15
  },
  tsp: {
    'Harina': 3,
    'Sal': 5,
    'Azúcar': 5,
    'Levadura en polvo': 3,
    'Aceite': 4,
    'Mantequilla derretida': 5,
    'Cacao en polvo': 2,
    'Miel': 7,
    'Leche': 5,
    'Agua': 5
  }
}

export const unidadesConv = {
  // Peso / Masa
  'kg': { grupo: 'peso', factor: 1000, nombre: 'Kilos (kg)' },
  'g': { grupo: 'peso', factor: 1, nombre: 'Gramos (g)' },
  'lb': { grupo: 'peso', factor: 453.59237, nombre: 'Libras (lb)' },
  'oz': { grupo: 'peso', factor: 28.34952, nombre: 'Onzas (oz)' },
  'mg': { grupo: 'peso', factor: 0.001, nombre: 'Miligramos (mg)' },
  // Volumen Líquido
  'l': { grupo: 'volumen', factor: 1000, nombre: 'Litros (l)' },
  'ml': { grupo: 'volumen', factor: 1, nombre: 'Mililitros (ml)' },
  'oz-fl': { grupo: 'volumen', factor: 29.5735, nombre: 'Onzas líquidas (fl oz)' },
  'taza-vol': { grupo: 'volumen', factor: 240, nombre: 'Tazas (240 ml)' },
  'cda-vol': { grupo: 'volumen', factor: 15, nombre: 'Cucharadas (15 ml)' },
  'cdta-vol': { grupo: 'volumen', factor: 5, nombre: 'Cucharaditas (5 ml)' }
}

export const recetasSustitutos = {
  'buttermilk': '🥛 <b>1 taza de Leche cortada / Buttermilk:</b> Mezcla <b>240 ml (1 taza) de leche entera o semidescremada</b> con <b>1 cucharada (15 ml) de jugo de limón o vinagre blanco</b>. Deja reposar a temperatura ambiente 10 a 15 minutos sin revolver hasta que se corte ligeramente.',
  'polvos': '✨ <b>1 cdta de Polvos de hornear:</b> Mezcla <b>1/4 cdta de bicarbonato de sodio</b> + <b>1/2 cdta de cremor tártaro</b> (o añade unas gotas de limón a los líquidos de la mezcla).',
  'azucarflor': '🍬 <b>1 taza de Azúcar flor (impalpable / glass):</b> Coloca en la licuadora o procesadora <b>1 taza (200 g) de azúcar granulada</b> + <b>1 cdta (5 g) de maicena</b>. Licúa a máxima potencia por 1 minuto hasta pulverizar fino.',
  'harinaleudante': '🌾 <b>1 taza de Harina con polvos de hornear (leudante):</b> Usa <b>1 taza (125 g) de harina sin polvos</b> + <b>1.5 cucharaditas (7 g) de polvos de hornear</b> + <b>1 pizca de sal fina</b>. Cierne 2 veces.',
  'huevo': '🥚 <b>1 Huevo (para humedad y estructura):</b> Elige una opción:<br>• <b>1/2 plátano maduro bien molido</b> (para queques y muffins).<br>• <b>60 g (1/4 taza) de puré de manzana</b> sin azúcar.<br>• <b>1 cda de chía o linaza molida</b> + 3 cdas de agua tibia (reposar 10 min).<br>• <b>60 g de yogur natural entero</b>.<br>• <b>1/4 taza de mayonesa</b> (para bizcochos húmedos de chocolate).',
  'chocolate': '🍫 <b>30 g de Chocolate cobertura amargo:</b> Mezcla <b>3 cucharadas (18 g) de cacao amargo en polvo</b> + <b>1 cucharada (14 g) de mantequilla derretida, margarina o aceite</b>.',
  'miel': '🍯 <b>1 taza de Miel de abejas o Miel de palma:</b> Sustituye por <b>1 taza de azúcar granulada o rubia</b> + <b>60 ml (1/4 taza) de agua o leche</b> (reduciendo esa misma cantidad del líquido total de la receta).',
  'crema': '🥣 <b>1 taza de Crema ácida (Sour cream / Crema agria):</b> Mezcla <b>240 ml (1 taza) de crema de leche o yogur natural/griego</b> con <b>1 cucharada de jugo de limón o vinagre blanco</b>.',
  'manjar': '🍮 <b>1 taza de Manjar / Dulce de leche fluido:</b> Calienta <b>1 taza de manjar tradicional</b> con <b>2 a 3 cucharadas de crema de leche o leche tibia</b> revolviendo a fuego bajo hasta aflojar.',
  'vanilla': '🌿 <b>1 cdta de Esencia de vainilla:</b> Sustituye por <b>1/2 cdta de ralladura de cáscara de naranja o limón</b> o <b>1/4 cdta de canela en polvo</b> o <b>1 cdta de licor (pisco, ron, amaretto)</b>.'
}

export const tablaMoldesFija = { 4: 10, 6: 15, 8: 20, 9: 23, 10: 25, 11: 28, 12: 30, 13: 33, 14: 40, 15: 45 }
