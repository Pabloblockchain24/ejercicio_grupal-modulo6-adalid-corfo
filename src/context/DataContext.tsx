import { createContext, useEffect, useState } from "react";
import { getAppointments, getDoctors, getServices, postAppointment, postDoctor, deleteAppointment, updateAppointment, postService } from "../services/api";
import { Doctor, Appointment, Service, DataProviderProps, DataContextType } from "../interfaces";

export const DataContext = createContext<DataContextType | undefined>(undefined);


// IMPORTANTE: Doctors se guardan mediante localStorage, Appointments se guardan mediante IndexedDB  
const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);


  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const storedDoctors = localStorage.getItem('doctors');
    return storedDoctors ? JSON.parse(storedDoctors) : [];
  });


  // modifico el componente, si no hay doctores en el local storage (siempre esta actualizado), los cargo desde la api.
  useEffect(() => {
    async function loadDoctors() {
      try {
        const storedDoctors = localStorage.getItem('doctors');
        if (storedDoctors && JSON.parse(storedDoctors).length > 0) {
          setDoctors(JSON.parse(storedDoctors));
        } else {
          const apiDoctors = await getDoctors();
          if (apiDoctors.length > 0) {
            setDoctors(apiDoctors);
            localStorage.setItem("doctors", JSON.stringify(apiDoctors));
          }
        }
      } catch (error) {
        console.error("Error al cargar los doctores:", error);
      }
    }
    loadDoctors();
  }, []);

  const loadServices = async () => {
    setLoadingServices(true);
    setErrorServices(null);
    try {
      const servicios_medicos = await getServices();
      setServices(servicios_medicos);
    } catch (error) {
      console.error("Error al cargar los servicios:", error);
      setErrorServices("Error al cargar los servicios. Por favor, intenta nuevamente.");
    } finally {
      setLoadingServices(false);
    }
  };

  // Cargar appointments desde IndexedDB
  useEffect(() => {
    const request = indexedDB.open("MedicosAdalid", 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("appointments")) {
        db.createObjectStore("appointments", { keyPath: "id" });
      }
    };
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB lista para usarse.')
    }

    request.onerror = (event) => {
      console.error("Error al abrir IndexedDB:", (event.target as IDBRequest).error);
    };


  }, []);

  // Guardar cita en IndexedDB
  const saveAppointmentToDB = (appointment: Appointment) => {
    const request = indexedDB.open("MedicosAdalid", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("appointments", "readwrite");
      const store = tx.objectStore("appointments");
      store.put(appointment);
      tx.oncomplete = () => db.close();
    };
  };

  const getAppointmentsFromDB = (): Promise<Appointment[]> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("MedicosAdalid", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("appointments", "readonly");
        const store = tx.objectStore("appointments");
        const allAppointments = store.getAll();
        allAppointments.onsuccess = () => resolve(allAppointments.result);
        tx.oncomplete = () => db.close();
      };
    });
  };

  const deleteAppointmentFromDB = (id: string) => {
    const request = indexedDB.open("MedicosAdalid", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("appointments", "readwrite");
      const store = tx.objectStore("appointments");
      store.delete(id);
      tx.oncomplete = () => db.close();
    };
  };

  const fetchAppointments = async (token: string) => {
    setLoadingAppointments(true);
    try {
      let storedAppointments = await getAppointmentsFromDB();

      if (storedAppointments.length === 0) {
        const apiAppointments = await getAppointments(token);
        apiAppointments.forEach(saveAppointmentToDB);
        storedAppointments = apiAppointments;
      }
      setAppointments(storedAppointments);
      return storedAppointments;
    } catch (error) {
      console.error("Error al cargar las citas:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);


  const force_error_loadServices = async () => {
    throw new Error("Error al cargar los servicios");
  }

  const reFetchServices = async () => {
    setLoadingServices(true);
    setTimeout(async () => {
      try {
        await loadServices();
        setLoadingServices(false);
        alert('Servicios cargados correctamente');
      } catch (error) {
        console.error("Error al cargar los servicios:", error);
        setErrorServices("Error al cargar los servicios. Por favor, intenta nuevamente.");
        setLoadingServices(false);
      }
    }, 1000);
  };


  const addAppointment = async (newAppointment: Appointment) => {
    try {
      const response = await postAppointment(newAppointment);
      if (response.error) {
        console.error("Error al agregar cita", response.error);
        return;
      }
      setAppointments((prev) => [...prev, response]);
      saveAppointmentToDB(response);
      console.log("Nueva cita agregada:", response);
    } catch (error) {
      console.error("Error al agregar cita:", error);
    }
  };

  const addDoctor = async (newDoctor: Doctor) => {
    try {
      const response = await postDoctor(newDoctor);
      if (response.error) {
        console.error("Error al agregar doctor", response.error);
        return
      }
      setDoctors((prevDoctors) => {
        const updatedDoctors = [...prevDoctors, response];
        localStorage.setItem("doctors", JSON.stringify(updatedDoctors));
        return updatedDoctors;
      });
      console.log("Nuevo doctor agregado:", newDoctor);
    } catch (error) {
      console.error("Error en la solicitud para agregar doctor:", error);
    }
  };

  const addService = (newService: Service) => {
    const response = postService(newService);
    if (response.error) {
      console.error("Error al agregar servicio", response.error);
    }
    console.log("Nuevo servicio médico agregado:", newService);
  };

  const delAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((appt) => appt.id !== id));
      deleteAppointmentFromDB(id);
      console.log("Cita eliminada:", id);
    } catch (error) {
      console.error("Error al eliminar cita:", error);
    }
  };

  const editAppointment = async (updatedAppointment: Appointment) => {
    try {
      const response = await updateAppointment(updatedAppointment.id, updatedAppointment);
      if (response.error) {
        console.error("Error al actualizar cita", response.error);
        return;
      }
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === updatedAppointment.id ? updatedAppointment : appt))
      );
      saveAppointmentToDB(updatedAppointment);
      console.log("Cita actualizada:", updatedAppointment);
    } catch (error) {
      console.error("Error al editar cita:", error);
    }
  };
  
  return (
    <DataContext.Provider
      value={{
        doctors,
        services,
        addAppointment,
        appointments,
        reFetchServices,
        loadingServices,
        errorServices,
        fetchAppointments,
        loadingAppointments,
        addDoctor,
        delAppointment,
        editAppointment,
        addService,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export default DataProvider;
