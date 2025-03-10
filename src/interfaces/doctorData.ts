export interface Doctor {
    nombre: string;
    especialidad: string;
    descripcion: string;
    imagen: string | null;
    experiencia: number | "";
    disponibilidad: string;
    contacto: string;
    horas_disponibles: string;
  }
  
  export interface Errors {
    [key: string]: string;
  }
  