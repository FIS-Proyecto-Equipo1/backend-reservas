const urljoin = require('url-join')
const request = require('request-promise-native').defaults({json: true})


class VehiculosResource {
    static STATUS_DISPONIBLE = "DISPONIBLE"
    static STATUS_RESERVADO = "RESERVADO"
    static STATUS_TRAYECTO = "TRAYECTO"
    
    static vehiculosUrl(resourceUrl) {
        const vehiculosServer = (process.env.VEHICULOS_URL || 'https://urbanio-vehiculos.herokuapp.com');
        return urljoin(vehiculosServer, resourceUrl);
    }


    static requestHeaders() {
        return {
            "x-role": "ADMIN",
            "rol": "ADMIN"
        };
    }

    static getVehicle(matricula) {
        console.log("getVehicle " + matricula)
        const url = VehiculosResource.vehiculosUrl("/api/v1/vehicles/" + matricula);

        const options = {
            headers: VehiculosResource.requestHeaders()
        }
        return request.get(url, options);
    }

    static patchVehicle(matricula, estado) {
        console.log("patchVehicle " + matricula + ", " + estado)
        const url = VehiculosResource.vehiculosUrl("/api/v1/vehicles/" + matricula);
        var body = {
            estado: estado
        }
        const options = {
            headers: VehiculosResource.requestHeaders(),
            body: body
        }

        

        return request.patch(url, options);
    }

    static patchVehicleLocalizacion(matricula, estado, ubicacion) {
        console.log("patchVehicle " + matricula + ", " + estado + ", " + ubicacion)
        const url = VehiculosResource.vehiculosUrl("/api/v1/vehicles/" + matricula);
        var body = {
            estado: estado,
            localizacion: ubicacion
        }
        const options = {
            headers: VehiculosResource.requestHeaders(),
            body: body
        }

        

        return request.patch(url, options);
    }
}


module.exports = VehiculosResource;