# EOL Order XBlock

EOL Order XBlock es una herramienta educativa diseñada para integrarse en cursos [edX](https://www.edx.org/). Esta herramienta permite a los estudiantes ordenar elementos en una secuencia específica, lo que es útil para evaluar su comprensión de procesos, pasos o conceptos que deben seguir un orden particular.

## Casos de uso

- Ordenar los pasos de un proceso científico
- Secuenciar eventos históricos en orden cronológico
- Organizar los componentes de un sistema en el orden correcto
- Ordenar los pasos de un algoritmo o procedimiento

![Ejemplo de uso del EOL Order XBlock](docs/images/example.png)

## Instalación

El método de instalación del EOL Order XBlock puede variar según tu configuración de Open edX. Se recomienda consultar la [documentación oficial](https://edx.readthedocs.io/projects/edx-installing-configuring-and-running/en/latest/configuration/install_xblock.html) para obtener instrucciones detalladas.

Para activar EOL Order XBlock en un curso, debe agregarse a la lista de módulos avanzados. Esto se puede hacer en la configuración avanzada del curso ingresando `eolorder` como nombre del módulo.

## Cómo usar

Para incorporar un EOL Order XBlock en tu curso:

1. Ve a una unidad específica en Studio
2. Selecciona "Avanzado" en las opciones
3. Elige "EOL Order XBlock"

Esto agregará un XBlock vacío a la unidad. Ten en cuenta que este XBlock no aparecerá en el LMS hasta que haya sido configurado correctamente.

### Configuración del contenido

El EOL Order XBlock permite configurar:

- **Título**: Especifica el título del módulo
- **Descripción**: Proporciona instrucciones o contexto para la actividad
- **Elementos a ordenar**: Lista de elementos que los estudiantes deben ordenar
- **Orden correcto**: Define el orden correcto de los elementos
- **Retroalimentación**: Mensajes personalizados para respuestas correctas e incorrectas

![Configuración del XBlock](docs/images/configuration.png)

### Opciones adicionales

- **Permitir reintentos**: Número máximo de intentos permitidos
- **Mostrar retroalimentación**: Opción para mostrar retroalimentación después de cada intento
- **Puntuación**: Configuración de la puntuación para respuestas correctas
- **Tiempo límite**: Establecer un tiempo límite para completar la actividad

## Puntuación

El EOL Order XBlock asigna puntuación basada en:
- Orden correcto de todos los elementos
- Incorrecto (orden incorrecto)

## Licencia

Este proyecto está licenciado bajo [AGPL-3.0](LICENSE).

## Soporte

Para reportar problemas o solicitar nuevas características, por favor crea un issue en el repositorio del proyecto. 