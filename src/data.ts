import homeCleaning from "./assets/services/home-cleaning.png";
import apartmentCleaning from "./assets/services/apartment-cleaning.png";
import deepCleaning from "./assets/services/deep-cleaning.png";
import upholsteryCleaning from "./assets/services/upholstery-cleaning.png";
import laundryKilo from "./assets/services/laundry-kilo.png";
import moveInCleaning from "./assets/services/move-in-cleaning.png";
import type { CleanerProfile, CleaningJob, ServiceItem, ServiceRequest } from "./types";

export const services: ServiceItem[] = [
  {
    id: "hogar-familiar",
    title: "Limpieza de Hogar Familiar",
    short: "Orden, banos, cocina, polvo, pisos y detalles de rutina.",
    detail:
      "Servicio pensado para casas familiares en Rohrmoser y Pavas con limpieza por zonas, prioridades claras y control final.",
    image: homeCleaning,
    priceHint: "Desde 3 horas"
  },
  {
    id: "apartamentos",
    title: "Limpieza de Apartamentos",
    short: "Ideal para torres, recepciones y accesos con Waze.",
    detail:
      "Coordinacion fina para edificios: apartamento, torre, recepcion, parqueo y reglas de ingreso.",
    image: apartmentCleaning,
    priceHint: "Agenda flexible"
  },
  {
    id: "profunda",
    title: "Limpieza Profunda",
    short: "Cocina, banos, grasa, sarro, zocalos y rincones.",
    detail:
      "Para limpiezas de mayor detalle antes o despues de temporadas, visitas o mudanzas.",
    image: deepCleaning,
    priceHint: "Por evaluacion"
  },
  {
    id: "muebles",
    title: "Muebles y Tapiceria",
    short: "Sofas, sillas, colchones y textiles con tecnica especializada.",
    detail:
      "Limpieza por material, prueba de color, aspirado profundo y productos adecuados para cada superficie.",
    image: upholsteryCleaning,
    priceHint: "Por pieza"
  },
  {
    id: "ropa-kilo",
    title: "Ropa por Kilo",
    short: "Lavado, secado y doblado con control por peso y entrega.",
    detail:
      "Servicio de ropa para hogares, apartamentos y personas con semanas cargadas.",
    image: laundryKilo,
    priceHint: "Por kilo"
  },
  {
    id: "mudanza",
    title: "Entrada o Salida",
    short: "Limpieza para entregar, recibir o reactivar un espacio.",
    detail:
      "Preparacion de apartamentos y casas antes de mudanza, alquiler o regreso al hogar.",
    image: moveInCleaning,
    priceHint: "Por tamano"
  }
];

export const demoRequests: ServiceRequest[] = [
  {
    id: "demo-request-1",
    serviceType: "Limpieza de Apartamentos",
    customerName: "Andrea Mora",
    customerPhone: "8888-1234",
    customerEmail: "andrea@example.com",
    propertyType: "Apartamento en torre",
    preferredDate: "2026-06-03",
    preferredTime: "09:00",
    address: "Nunciatura, Rohrmoser, San Jose",
    wazeUrl: "https://waze.com/ul/demo-rohrmoser",
    apartment: "Torre 2, apartamento 8B",
    entryInstructions: "Anunciarse en recepcion con cedula. Parqueo de visitas 14.",
    cleaningInstructions: "Prioridad en cocina, banos y ventanales internos.",
    notes: "Tiene mascota pequena.",
    status: "new"
  },
  {
    id: "demo-request-2",
    serviceType: "Muebles y Tapiceria",
    customerName: "Marco Solis",
    customerPhone: "8700-4422",
    customerEmail: "marco@example.com",
    propertyType: "Casa familiar",
    preferredDate: "2026-06-05",
    preferredTime: "13:00",
    address: "Pavas, cerca de Plaza Mayor",
    wazeUrl: "https://waze.com/ul/demo-pavas",
    apartment: "Casa 42",
    entryInstructions: "Tocar porton blanco. El guarda llama al dueno.",
    cleaningInstructions: "Sofa modular de tela clara y dos sillas.",
    notes: "Confirmar secado antes de salir.",
    status: "quoted"
  }
];

export const demoCleaners: CleanerProfile[] = [
  {
    id: "demo-cleaner-1",
    fullName: "Valeria Campos",
    email: "valeria@example.com",
    phone: "7010-5555",
    nationalId: "1-1111-1111",
    districts: "Rohrmoser, Pavas, Sabana",
    experience: "5 anos en hogares, apartamentos y limpieza profunda.",
    availability: "Lunes a viernes, manana y tarde.",
    hourlyRate: "3500",
    status: "approved"
  },
  {
    id: "demo-cleaner-2",
    fullName: "Karla Brenes",
    email: "karla@example.com",
    phone: "7222-9090",
    nationalId: "1-2222-2222",
    districts: "Pavas, Escazu, Rohrmoser",
    experience: "Tapiceria, cocina profunda y lavanderia por kilo.",
    availability: "Martes, jueves y sabado.",
    hourlyRate: "3800",
    status: "pending"
  }
];

export const demoJobs: CleaningJob[] = [
  {
    id: "demo-job-1",
    serviceType: "Limpieza de Apartamentos",
    customerName: "Andrea Mora",
    customerPhone: "8888-1234",
    wazeUrl: "https://waze.com/ul/demo-rohrmoser",
    address: "Nunciatura, Rohrmoser, San Jose",
    apartment: "Torre 2, apartamento 8B",
    entryInstructions: "Anunciarse en recepcion con cedula.",
    cleaningInstructions: "Cocina, banos, pisos y ventanales internos.",
    scheduledDate: "2026-06-03",
    startTime: "09:00",
    endTime: "13:00",
    estimatedHours: 4,
    payRate: 3500,
    notes: "Mascota pequena en sala.",
    status: "available"
  },
  {
    id: "demo-job-2",
    serviceType: "Limpieza Profunda",
    customerName: "Natalia Vega",
    customerPhone: "8999-0101",
    wazeUrl: "https://waze.com/ul/demo-sabana",
    address: "Boulevard Rohrmoser",
    apartment: "Casa esquinera",
    entryInstructions: "Porton electrico. Llamar 10 minutos antes.",
    cleaningInstructions: "Banos, cocina con grasa y closet de lavado.",
    scheduledDate: "2026-06-06",
    startTime: "08:00",
    endTime: "14:00",
    estimatedHours: 6,
    payRate: 3800,
    notes: "Llevar productos antigrasa.",
    status: "scheduled",
    acceptedBy: "demo-cleaner-1",
    acceptedByName: "Valeria Campos",
    acceptedByPhone: "7010-5555"
  },
  {
    id: "demo-job-3",
    serviceType: "Ropa por Kilo",
    customerName: "Laura Chacon",
    customerPhone: "8111-2222",
    wazeUrl: "https://waze.com/ul/demo-pavas-laundry",
    address: "Pavas Centro",
    apartment: "Apartamento 3",
    entryInstructions: "Entregar bolsas en recepcion.",
    cleaningInstructions: "Separar ropa blanca y colores.",
    scheduledDate: "2026-05-30",
    startTime: "10:00",
    endTime: "12:00",
    estimatedHours: 2,
    payRate: 3300,
    notes: "Finalizado y entregado.",
    status: "finished",
    acceptedBy: "demo-cleaner-1",
    acceptedByName: "Valeria Campos",
    acceptedByPhone: "7010-5555"
  }
];
