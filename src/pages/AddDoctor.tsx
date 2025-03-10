import { useState, useContext, ChangeEvent, FormEvent, useRef  } from "react";
import { DataContext } from "../context/DataContext";
import { Doctor, Errors } from "../interfaces";

const AddDoctor: React.FC = () => {
  const { addDoctor } = useContext(DataContext);
  const [doctor, setDoctor] = useState<Doctor>({
    nombre: "",
    especialidad: "",
    descripcion: "",
    imagen: "",
    experiencia: "",
    disponibilidad: "",
    contacto: "",
    horas_disponibles: ""
  });

  const [errors, setErrors] = useState<Errors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const validateForm = (): boolean => {
    let newErrors: Errors = {};

    if (!doctor.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!doctor.especialidad.trim()) newErrors.especialidad = "La especialidad es obligatoria";
    if (!doctor.descripcion.trim()) newErrors.descripcion = "La descripción es obligatoria";
    if (!doctor.imagen.trim()) newErrors.imagen = "La imagen es obligatoria";
    if (!doctor.experiencia || doctor.experiencia < 1)
      newErrors.experiencia = "Debe ingresar al menos 1 año de experiencia";
    if (!doctor.disponibilidad.trim()) newErrors.disponibilidad = "La disponibilidad es obligatoria";
    if (!doctor.contacto.trim()) newErrors.contacto = "El contacto es obligatorio";
    if (!doctor.horas_disponibles.trim()) newErrors.horas_disponibles = "Las horas disponibles son obligatorias";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDoctor({ ...doctor, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setDoctor({ ...doctor, imagen: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
    }
  };


  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setImagePreview(imageData);
    setDoctor({ ...doctor, imagen: imageData });
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setImagePreview(null);
    if (option === "camera") startCamera();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    addDoctor({
      ...doctor,
      informacion_adicional: {
        contacto: doctor.contacto,
        horas_disponibles: doctor.horas_disponibles
      }
    });

    alert("Doctor agregado exitosamente");

    setDoctor({
      nombre: "",
      especialidad: "",
      descripcion: "",
      imagen: "",
      experiencia: "",
      disponibilidad: "",
      contacto: "",
      horas_disponibles: ""
    });
    setImagePreview(null);
    setSelectedOption(null);
    setErrors({});
  };

  return (
    <div className="doctor-form__container">
      <h2>Agregar Doctor</h2>
      <form onSubmit={handleSubmit}>
        {[
          { name: "nombre", type: "text", placeholder: "Nombre" },
          { name: "especialidad", type: "text", placeholder: "Especialidad" },
          { name: "descripcion", type: "textarea", placeholder: "Descripción" },
          { name: "experiencia", type: "number", placeholder: "Años de experiencia" },
          { name: "disponibilidad", type: "text", placeholder: "Disponibilidad" },
          { name: "contacto", type: "text", placeholder: "Contacto" },
          { name: "horas_disponibles", type: "text", placeholder: "Horas disponibles" }
        ].map(({ name, type, placeholder }) => (
          <div key={name}>
            {type === "textarea" ? (
              <textarea
                name={name}
                placeholder={placeholder}
                value={doctor[name]}
                onChange={handleChange}
                className={errors[name] ? "error-input" : ""}
              />
            ) : (
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={doctor[name]}
                onChange={handleChange}
                className={errors[name] ? "error-input" : ""}
              />
            )}
            {errors[name] && <p className="error-text">{errors[name]}</p>}
          </div>
        ))}

        <div>
          <h4>Imagen del Doctor</h4>
          <div >
            {imagePreview ? (
              <div className="image-preview">
                <p>Imagen seleccionada:</p>
                <img src={imagePreview} alt="Vista previa" />
              </div>
            ) : (
              <p>Seleccione una opción</p>
            )}
          </div>

          <div className="image-options">
            <button type="button" onClick={() => handleOptionSelect("upload")}>Subir Imagen</button>
            <button type="button" onClick={() => handleOptionSelect("camera")}>Tomar Foto</button>
          </div>

          {selectedOption === "upload" && (
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          )}

          {selectedOption === "camera" && (
            <div className="camera-container">
              <video ref={videoRef} autoPlay />
              <button type="button" onClick={capturePhoto}>Capturar Foto</button>
              <canvas ref={canvasRef} ></canvas>
            </div>
          )}
        </div>

        <button type="submit" disabled={Object.keys(errors).length > 0}>
          Agregar Doctor
        </button>
      </form>
    </div>
  );
}

export default AddDoctor;
