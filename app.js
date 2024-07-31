
var arrayFullData = [];
var dataTable = "";
var headDataTable = ["Tag Name","Address","Data Type","Respect Data Type","Client Access","Scan Rate","Scaling","Raw Low","Raw High","Scaled Low","Scaled High","Scaled Data Type","Clamp Low","Clamp High","Eng Units","Description","Negate Value"]
var headDataLogger = [
    "Item ID","Numeric Alias / ID","Data Type","Deadband Type","Deadband","Range Low","Range High"
]

function xmlToJson(xml) {
        // XML'yi JSON formatına dönüştür
        const obj = {};

        if (xml.nodeType === 1) { // Element node
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (let j = 0; j < xml.attributes.length; j++) {
                    const attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType === 3) { // Text node
            obj["#text"] = xml.nodeValue.trim();
        }

        if (xml.hasChildNodes()) {
            for (let i = 0; i < xml.childNodes.length; i++) {
                const item = xml.childNodes.item(i);
                const nodeName = item.nodeName;

                if (item.nodeType === 1) { // Element node
                    if (typeof(obj[nodeName]) === "undefined") {
                        obj[nodeName] = xmlToJson(item);
                    } else {
                        if (typeof(obj[nodeName].push) === "undefined") {
                            const old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xmlToJson(item));
                    }
                }
            }
        }

        return obj;
}

document.getElementById('convert-btn').addEventListener('click', function() {

        let dataLoggerCheck = document.getElementById("dataLoggerCheck");

        if(dataLoggerCheck.checked) {
            tableOrLoggerToCsv("logger", event)
        } else {
            tableOrLoggerToCsv("table", event)
        }
});

function tableOrLoggerToCsv(option,event) {

        const fileInput = document.getElementById('file-input');
        if (fileInput.files.length === 0) {
            alert('Lütfen bir XML dosyası seçin.');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            const xmlString = event.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            // Hata kontrolü
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length) {
                let errorBox = document.getElementById('json-output');
                errorBox.classList.remove('d-none');

                errorBox.classList.add('alert');
                errorBox.classList.add('alert-danger');
                errorBox.textContent = 'Hatalı XML verisi!';

                setTimeout(() => {
                    errorBox.classList.add('d-none')
                }, 1500);

                return;
            }

            const json = xmlToJson(xmlDoc.documentElement);

            dataTable = json.addData.data[0].globalVars.variable;

            if(option == "table") {
                arrayFullData.push(headDataTable);
            } else if(option == "logger") {
                arrayFullData.push([";"])
                arrayFullData.push(["; LogItem"])
                arrayFullData.push([";"])
                arrayFullData.push(headDataLogger);
                console.log(arrayFullData)
            }

            for (let i = 0; i < dataTable.length; i++) {
                const element = dataTable[i];
                const elementName = element["@attributes"].name;
                var elementAddress = element["@attributes"].address;


                if(elementAddress == undefined) {
                    // console.log(element.type.BOOL)
                    if(element.type.BOOL) {
                        element.type = "BOOL";
                        elementAddress = "BOOL";
                        // console.log(elementAddress);
                }
                } else {
                    elementAddress = elementAddress.slice(3) * 2 - 2 + 30000;
                }
                    if(option == "table") {
                        arrayFullData.push([elementName, String(elementAddress), `Float`,1, `RO`,100]);
                    } else if(option == "logger") {
                        let dataLoggerInputValue = document.getElementById("data-logger-text-input").value;
                        console.log(dataLoggerInputValue)

                        arrayFullData.push([dataLoggerInputValue + '.' + elementName, String(elementAddress), `Float`,`None`, `0.000000`,`0.000000`,`0.000000`,]);
                    }
            }
                    
                    // Verileri bir çalışma sayfasına çevir
                    const worksheet = XLSX.utils.aoa_to_sheet(arrayFullData);

                    // Yeni bir çalışma kitabı oluştur
                    const workbook = XLSX.utils.book_new();

                    // Çalışma sayfasını çalışma kitabına ekle
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

                    // Çalışma kitabını bir binary string olarak yaz
                    const wbout = XLSX.write(workbook, { bookType: 'csv', type: 'binary' });

                    // String'i ArrayBuffer'a çeviren yardımcı fonksiyon
                    function s2ab(s) {
                        const buf = new ArrayBuffer(s.length);
                        const view = new Uint8Array(buf);
                        for (let i = 0; i < s.length; i++) {
                            view[i] = s.charCodeAt(i) & 0xFF;
                        }
                        return buf;
                    }

                    // Dosyayı indirmek için Blob oluştur ve URL oluştur
                    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);

                    // İndirme işlemini başlatmak için geçici bir link oluştur
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${option}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    window.location.reload();

                    // console.log(arrayFullData)
        };

        reader.readAsText(file);
}

function dataLoggerChange() {
    let dataLoggerCheck = document.getElementById("dataLoggerCheck");
    let dataLoggerInput = document.getElementById("data-logger-text-input");

    if(dataLoggerCheck.checked) //true & checked 
    {
        dataLoggerInput.classList.remove("d-none");
    } else {
        dataLoggerInput.classList.add("d-none");
    }
}