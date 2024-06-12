const fs = require('fs');
const axios = require('axios');
const xlsx = require('xlsx');
const colors = require('colors');
const cliProgress = require('cli-progress');
const notifier = require('node-notifier');

let errorProductos = [];
const workbook = xlsx.readFile('excel/productos.xlsx');
const sheet_name_list = workbook.SheetNames;
const productos = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);



const progressBar = new cliProgress.SingleBar({
    format: '[{bar}] | {percentage}% || {value}/{total} Productos || {customMessage}',
    barCompleteChar: '█',
    barIncompleteChar: ' ',
    hideCursor: true
});

// SHEIN - API
// const SHEIN_API_URL = 'https://openapi.sheincorp.com/v1/products';
const SHEIN_API_URL = 'https://openapi-test01.sheincorp.cn/';
const API_KEY = '1184FA136F00096C6CBCFCCB9F4A7';
const API_SECRET = 'TU_API_SECRET';

const uploadProduct = async(product, productos) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulación de 100 ms
        const response = await axios.post(SHEIN_API_URL, product, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}: ${API_SECRET }`
            }
        });
        console.log(response);
        console.log(colors.green(` Producto subido exitosamente:`) + colors.bgBlue(` ${product.name} `));
    } catch (error) {
        //     notifier.notify({
        //         title: 'Error SHEIN',
        //         message: `Con el producto: 
        // * ID: ${productos.id}
        // * Producto: ${productos.name}`,
        //         icon: './src/logo.png',

        //     });
        console.log(colors.red(` Error al subir el producto:`) + colors.bgBlue(` ${product.name} ${productos.id}`));
        errorProductos.push(productos);
        if (!fs.existsSync('sheinError.json')) {
            fs.writeFileSync('sheinError.json', JSON.stringify([]));
        }
        let errorProductosJSON = fs.readFileSync('sheinError.json', 'utf8');
        errorProductosJSON = JSON.parse(errorProductosJSON);
        let contador = 0;
        errorProductos.forEach(producto => {
            const productoExistente = errorProductosJSON.find(p => p.id === producto.id);
            if (!productoExistente) {
                console.log(`El producto con id ${producto.id} ya existe`);
                contador++;
            }
        });
        errorProductosJSON.push(...errorProductos.filter(producto => {
            const productoExistente = errorProductosJSON.find(p => p.id === producto.id);
            return !productoExistente;
        }));
        fs.writeFileSync('sheinError.json', JSON.stringify(errorProductosJSON));

    }
};


const totalProductos = productos.length;
let customMessage = "Esperando tiempo ??";
progressBar.start(totalProductos, 0, {
    customMessage: customMessage
});

async function procesarProductos() {
    let productosProcesados = 0;
    let totalTime = 0;
    for (const producto of productos) {
        const startTime = Date.now();
        const newProduct = {
            name: producto.Nombre,
            description: producto.Descripcion || `Descripción del producto ${producto.Nombre}`,
            category: producto.Categoria,
            price: producto.Precio,
            stock: producto.Stock,
            images: [
                producto.Imagen1,
                producto.Imagen2,
                producto.Imagen3,
                producto.Imagen4
            ],
        };

        const newProductId = {
            name: producto.Nombre,
            id: producto.id
        };


        await uploadProduct(newProduct, newProductId);
        productosProcesados++;

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        totalTime += elapsedTime;

        // Calculamos tiempo que se va demorar
        const avgTimePerProduct = totalTime / productosProcesados;
        const remainingTime = avgTimePerProduct * (totalProductos - productosProcesados);
        const remainingMinutes = Math.floor(remainingTime / 60000); // Minutos restantes
        const remainingSeconds = Math.floor((remainingTime % 60000) / 1000); // Segundos restantes
        const timeMessage = `Tiempo: ${remainingMinutes}m ${remainingSeconds}s`;
        progressBar.update(productosProcesados, {
            customMessage: `${timeMessage}`

        });
    }
    progressBar.stop();
    console.log(colors.bgGreen.black(`  > Proceso completado  `));
    notifier.notify({
        title: 'Upload Productos SHEIN',
        message: `Terminamos 🎉`,
        icon: './src/logo.png',

    });

}


async function main() {
    await procesarProductos();
}

main();