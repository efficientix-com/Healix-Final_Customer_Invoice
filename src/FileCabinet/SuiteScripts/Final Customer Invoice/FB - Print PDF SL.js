/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @name FB - Print PDF SL
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary This script will generate and show the final PDF in the opened new tab.
 * @copyright Tekiio México 2023
 * 
 * Client              -> Healix
 * Last modification   -> 06/06/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Print PDF SL <custscript_fb_print_pdf_invg_sl>
 */
define(['N/log', 'N/record', 'N/render', 'N/search', 'N/runtime', 'N/file', 'N/format', 'N/url'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{render} render
 * @param{search} search
 * @param{runtime} runtime
 * @param{file} file
 */
    (log, record, render, search, runtime, file, format, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var jsonRepsonse;
            try {
                var request = scriptContext.request;
                var params = request.parameters;
                var scriptObj = runtime.getCurrentScript();
                log.debug('Remaining governance units start: ', scriptObj.getRemainingUsage());
                var templateId = params.templateID;
                var recordId = params.recordID;
                log.debug({title:'DataReceived', details:{templateId: templateId, recordId: recordId}});
                var generalInfoResult = getGeneralInformation(recordId);
                log.debug({title:'generalInfoResult', details:generalInfoResult});
                if (generalInfoResult.sucess) {
                    var invoicesResult = getInfoInvoices(generalInfoResult.trans);
                    log.debug({title:'invocesResult', details:invoicesResult});
                    if (invoicesResult.sucess) {
                        var ordenResult = groupInformation(invoicesResult.data);
                        log.debug({title:'ordenResult', details:ordenResult});
                        if (ordenResult.sucess) {
                            log.debug({title:'Crear PDF', details:'Here'});
                            var dataJsonResult = buildDataPDF(generalInfoResult.data, ordenResult.data, invoicesResult.data);
                            log.debug({title:'dataJson', details:dataJsonResult});
                            if (dataJsonResult.sucess) {
                                var render_pdf = render.create();
                                render_pdf.setTemplateById(templateId);
                                var transactionFile = null;
                                render_pdf.addCustomDataSource({format: render.DataSource.OBJECT, alias: "RECORD_PDF", data: dataJsonResult.data});
                                transactionFile = render_pdf.renderAsPdf();
                                scriptContext.response.writeFile({
                                    file: transactionFile,
                                    isInline: true
                                });
                            }else{
                                jsonRepsonse = {'error': ordenResult.error};
                                scriptContext.response.writeLine({
                                    output: JSON.stringify(jsonRepsonse)
                                }); 
                            }
                        }else{
                            jsonRepsonse = {'error': ordenResult.error};
                            scriptContext.response.writeLine({
                                output: JSON.stringify(jsonRepsonse)
                            });
                        }
                    }else{
                        jsonRepsonse = {'error': invoicesResult.error};
                        scriptContext.response.writeLine({
                            output: JSON.stringify(jsonRepsonse)
                        });
                    }
                }else{
                    jsonRepsonse = {'error': generalInfoResult.error};
                    scriptContext.response.writeLine({
                        output: JSON.stringify(jsonRepsonse)
                    });
                }
                log.debug('Remaining governance units final: ', scriptObj.getRemainingUsage());
            } catch (error) {
                log.error({title:'onRequest', details:error});
                jsonRepsonse = {'error': 'Your template cannot be rendered, please check the advanced PDF format.'};
                scriptContext.response.writeLine({
                    output: JSON.stringify(jsonRepsonse)
                });
            }
        }

        /**
         * This function retrieves general information about an invoice group record and its associated
         * transactions.
         * @param recordId - The internal ID of the invoice group record to retrieve information from.
         * @returns an object with properties "success", "error", "data", and "trans". The "success"
         * property indicates whether the function executed successfully or not. The "error" property
         * contains any error message if the function encountered an error. The "data" property
         * contains an object with general information about an invoice group, such as the document
         * number, customer name, date, total amount,
         */
        function getGeneralInformation(recordId) {
            var dataReturn = {sucess: false, error: '', data: '', trans: ''};
            try {
                var mySearch = search.create({
                    type: search.Type.INVOICE_GROUP,
                    filters:
                    [
                       ["internalid","anyof",recordId]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "internalid",
                          summary: "GROUP",
                          sort: search.Sort.ASC,
                          label: "Internal ID"
                       }),
                       search.createColumn({
                          name: "customer",
                          summary: "GROUP",
                          label: "Customer"
                       }),
                       search.createColumn({
                          name: "internalid",
                          join: "transaction",
                          summary: "GROUP",
                          label: "Internal ID"
                       }),
                       search.createColumn({
                          name: "invoicegroupnumber",
                          summary: "GROUP",
                          label: "Invoice Group #"
                       }),
                       search.createColumn({
                          name: "trandate",
                          summary: "GROUP",
                          label: "Date"
                       }),
                       search.createColumn({
                          name: "fxamount",
                          summary: "GROUP",
                          label: "Amount (Foreign Currency)"
                       }),
                        search.createColumn({
                            name: "billaddress",
                            summary: "GROUP",
                            label: "Billing Address"
                        }),
                        search.createColumn({
                           name: "terms",
                           summary: "GROUP",
                           label: "Terms"
                        }),
                        search.createColumn({
                           name: "duedate",
                           summary: "GROUP",
                           label: "Due Date"
                        }),
                        search.createColumn({
                           name: "subsidiary",
                           summary: "GROUP",
                           label: "Subsidiary"
                        }),
                        search.createColumn({
                           name: "currency",
                           summary: "GROUP",
                           label: "Currency"
                        }),
                        search.createColumn({
                           name: "fxamountdue",
                           summary: "GROUP",
                           label: "Amount Due (Foreign Currency)"
                        }),
                        search.createColumn({
                           name: "fxamountpaid",
                           summary: "GROUP",
                           label: "Amount Paid (Foreign Currency)"
                        }),
                        search.createColumn({
                           name: "taxtotal",
                           summary: "AVG",
                           label: "Tax Total"
                        }),
                        search.createColumn({
                           name: "shippingcost",
                           summary: "AVG",
                           label: "Shipping Cost"
                        }),
                        search.createColumn({
                            name: "itemtotal",
                            summary: "AVG",
                            label: "Item Total"
                         }),
                         search.createColumn({
                            name: "ponumber",
                            summary: "GROUP",
                            label: "Purchase Order Number"
                         }),
                         search.createColumn({
                            name: "memo",
                            summary: "GROUP",
                            label: "Memo"
                         })
                    ]
                });
                var myPagedData = mySearch.runPaged({
                    pageSize: 1000
                });
                log.debug("invoicegroupSearchObj result count",myPagedData.count);
                var transactionIds = [];
                var docNum, poNum, cusName, memo, date, total, transId, address, terms, dueDate, subsidiary, currency, dueAmount, paidAmount, taxAvg, itemAvg, idDocNum;
                myPagedData.pageRanges.forEach(function(pageRange){
                    var myPage = myPagedData.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        idDocNum = result.getValue({
                            name: "internalid",
                            summary: "GROUP"
                        });
                        docNum = result.getValue({
                            name: "invoicegroupnumber",
                            summary: "GROUP",
                        });
                        poNum = result.getValue({
                            name: "ponumber",
                            summary: "GROUP"
                        });
                        if (poNum == '- None -') {
                            poNum = ''
                        }
                        memo = result.getValue({
                            name: "memo",
                            summary: "GROUP"
                        });
                        if (memo == '- None -') {
                            memo = ''
                        }
                        cusName = result.getText({
                            name: "customer",
                            summary: "GROUP",
                        });
                        date = result.getValue({
                            name: "trandate",
                            summary: "GROUP",
                        });
                        total = result.getValue({
                            name: "fxamount",
                            summary: "GROUP",
                        });
                        total = format.format({
                            value: total,
                            type: format.Type.CURRENCY2
                        });
                        address = result.getValue({
                            name: "billaddress",
                            summary: "GROUP",
                        });
                        if (address == '- None -') {
                            address = ''
                        }
                        terms = result.getValue({
                            name: "terms",
                            summary: "GROUP",
                        });
                        dueDate = result.getValue({
                            name: "duedate",
                            summary: "GROUP",
                        });
                        subsidiary = result.getValue({
                            name: "subsidiary",
                            summary: "GROUP",
                        });
                        currency = result.getText({
                            name: "currency",
                            summary: "GROUP",
                        });
                        dueAmount = result.getValue({
                            name: "fxamountdue",
                            summary: "GROUP",
                        });
                        dueAmount = format.format({
                            value: dueAmount,
                            type: format.Type.CURRENCY2
                        });
                        paidAmount = result.getValue({
                            name: "fxamountpaid",
                            summary: "GROUP",
                        });
                        paidAmount = format.format({
                            value: paidAmount,
                            type: format.Type.CURRENCY2
                        });
                        taxAvg = result.getValue({
                            name: "taxtotal",
                            summary: "AVG"
                        });
                        taxAvg = format.format({
                            value: taxAvg,
                            type: format.Type.CURRENCY2
                        });
                        itemAvg = result.getValue({
                            name: "itemtotal",
                            summary: "AVG",
                        });
                        itemAvg = format.format({
                            value: itemAvg,
                            type: format.Type.CURRENCY2
                        });
                        transId = result.getValue({
                            name: "internalid",
                            join: "transaction",
                            summary: "GROUP",
                        });
                        transactionIds.push(transId);
                    });
                });
                var headerInfo = {docNum: docNum, idDocNum: idDocNum, poNum: poNum, memo: memo, cusName: cusName, date: date, total: total, 
                    address: address, terms: terms, dueDate: dueDate, subsidiary: subsidiary, 
                    currency: currency, dueAmount: dueAmount, paidAmount: paidAmount, subsidiary_logo: '', 
                    subsidiary_adress: '', subsidiary_name: '', taxAvg: taxAvg, itemAvg: itemAvg};
                log.debug({title:'DataFound', details: headerInfo});
                log.debug({title:'transactionIds', details:transactionIds});
                var subsidiary_record = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: subsidiary
                });
                headerInfo.subsidiary_adress = subsidiary_record.getValue('mainaddress_text');
                var subsidiary_logo_id = subsidiary_record.getValue('logo');
                headerInfo.subsidiary_name = subsidiary_record.getValue('legalname');
                if (subsidiary_logo_id) {
                    var file_logo = file.load({id: subsidiary_logo_id});
                    var subsidiary_logo = file_logo.url;
                    // headerInfo.subsidiary_logo = file_logo.url;
                    var scheme = 'https://';
                    var host = url.resolveDomain({
                        hostType: url.HostType.APPLICATION
                    });
                    var urlFinal = scheme + host + subsidiary_logo;
                    headerInfo.subsidiary_logo = urlFinal;
                } else {
                    headerInfo.subsidiary_logo = '';
                }
                dataReturn.data = headerInfo;
                dataReturn.trans = transactionIds;
                dataReturn.sucess = true;
            } catch (error) {
                log.error({title:'getGeneralInformation', details:error});
                dataReturn.sucess = false;
                dataReturn.error = error;
            }
            return dataReturn;
        }

        /**
         * The function searches for invoice data based on given filters and returns the data in a
         * structured format.
         * @param invoices - The parameter "invoices" is an array of internal IDs of invoices to be
         * searched for in NetSuite.
         * @returns an object with three properties: "success", "error", and "data". The "success"
         * property is a boolean indicating whether the function executed successfully or not. The
         * "error" property is a string containing an error message if the function encountered an
         * error. The "data" property is an object containing information about the invoices that match
         * the search criteria.
         */
        function getInfoInvoices(invoices) {
            var dataReturn = {sucess: false, error: '', data: ''}
            try {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                    [
                       ["internalid","anyof",invoices], 
                       "AND", 
                       ["type","anyof","CustInvc"], 
                       "AND", 
                       ["mainline","is","F"], 
                       "AND", 
                       ["taxline","is","F"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "item", label: "Artículo"}),
                        search.createColumn({name: "quantityuom", label: "Cantidad en unidades de la transacción"}),
                        search.createColumn({name: "unit", label: "Unidades"}),
                        search.createColumn({name: "quantity", label: "Cantidad"}),
                        search.createColumn({name: "amount", label: "Importe"}),
                        search.createColumn({name: "taxamount", label: "Impuestos"}),
                        search.createColumn({name: "taxtotal", label: "Total impuestos"}),
                        search.createColumn({name: "total", label: "total transacción"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({
                            name: "class",
                            join: "item",
                            label: "Class"
                         }),
                        search.createColumn({name: "rate", label: "Rate 1"}),
                        search.createColumn({
                            name: "displayname",
                            join: "item",
                            label: "Name item"
                         })
                    ]
                });
                var myPagedData = invoiceSearchObj.runPaged({
                    pageSize: 1000
                });
                log.debug({title:'ItemCount', details:myPagedData.count});
                var allDataItems = {};
                var lastInvoice = '';
                myPagedData.pageRanges.forEach(function(pageRange){
                    var myPage = myPagedData.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var invoiceId = result.getValue({name: 'internalid'});
                        var invoiceNum = result.getValue({name: 'tranid'});
                        var invoiceTotal = result.getValue({name: 'total'});
                        var invoiceImp = result.getValue({name: 'taxtotal'});
                        var invoiceDate = result.getValue({name: 'trandate'});
                        var itemId = result.getValue({name: 'item'});
                        var itemName = result.getText({name: 'item'});
                        var itemDisplayName = result.getValue({
                            name: "displayname",
                            join: "item",
                        });
                        itemName = itemName+' '+itemDisplayName;
                        var itemQuanTotal = result.getValue({name: 'quantity'});
                        var itemQuan = result.getValue({name: 'quantityuom'});
                        var itemUnit = result.getValue({name: 'unit'});
                        var itemAmoun = result.getValue({name: 'amount'});
                        var itemImpu = result.getValue({name: 'taxamount'});
                        var itemRate = result.getValue({name: 'rate'});
                        itemRate = Number(itemAmoun)/Number(itemQuan);
                        itemRate = format.format({
                            value: itemRate,
                            type: format.Type.CURRENCY2
                        });
                        var itemCategory = result.getText({
                            name: "class",
                            join: "item"
                        }) || 'Without category';
                        if (itemUnit != '') {
                            // log.debug({title:'Items Push', details:{itemId: itemId, itemName: itemName, itemQuan: itemQuan, itemUnit: itemUnit, itemQuanTotal: itemQuanTotal, itemAmoun: itemAmoun, itemImpu: itemImpu, itemCategory: itemCategory, itemRate: itemRate}});
                            if (lastInvoice != invoiceId) {
                                lastInvoice = invoiceId
                                allDataItems[invoiceId] = {invoiceId: invoiceId, invoiceNum: invoiceNum, invoiceTotal: invoiceTotal, invoiceImp: invoiceImp, invoiceDate: invoiceDate, items: []};
                                allDataItems[invoiceId].items.push({itemId: itemId, itemName: itemName, itemQuan: itemQuan, itemUnit: itemUnit, itemQuanTotal: itemQuanTotal, itemAmoun: itemAmoun, itemImpu: itemImpu, itemCategory: itemCategory, itemRate: itemRate});
                            }else{
                                allDataItems[invoiceId].items.push({itemId: itemId, itemName: itemName, itemQuan: itemQuan, itemUnit: itemUnit, itemQuanTotal: itemQuanTotal, itemAmoun: itemAmoun, itemImpu: itemImpu, itemCategory: itemCategory, itemRate: itemRate});
                            }
                        }
                    });
                });
                dataReturn.sucess = true;
                dataReturn.data = allDataItems;
            } catch (error) {
                log.error({title:'getInfoInvoices', details:error});
                dataReturn.sucess = false;
                dataReturn.error = 'It was not possible to obtain the data of the invoices.';
            }
            return dataReturn;
        }

        /**
         * The function takes in an object of invoice information, groups the items by category, and
         * returns a new object with the grouped information.
         * @param info - The input parameter "info" is an object containing information about invoices
         * and their items. It has the following structure:
         * @returns an object with three properties: "success", "error", and "data". The "success"
         * property is a boolean indicating whether the function executed successfully or not. The
         * "error" property is a string that contains an error message if the function encountered an
         * error. The "data" property is an object that contains the grouped information based on the
         * input provided to the function.
         */
        function groupInformation(info) {
            var dataReturn = {sucess: false, error: '', data: ''};
            try {
                // log.debug({title:'info', details:info});
                var invoiceIds = Object.keys(info);
                var dataItems = {};
                // log.debug({title:'invoiceIds', details:invoiceIds});
                for (var transIter = 0; transIter < invoiceIds.length; transIter++) {
                    var invoiceId = invoiceIds[transIter];
                    // log.debug({title:'transIter: ' + transIter, details:info[invoiceId]});
                    for (var itemIter = 0; itemIter < info[invoiceId].items.length; itemIter++) {
                        var itemData = info[invoiceId].items[itemIter];
                        // log.debug({title:'itemIter: ' + itemIter, details:itemData});
                        // log.debug({title:'idItem', details:itemData.itemId});
                        if (dataItems[itemData.itemId]) {
                            // log.debug({title:'daaExistente', details:dataItems[itemData.itemId]});
                            // log.debug({title:'dataItem', details:dataItems[itemData.itemId].itemAmoun});
                            // log.debug({title:'itemData', details:itemData.itemAmoun});
                            var oldAmount = Number(dataItems[itemData.itemId].itemAmoun);
                            var sumAmount = Number(itemData.itemAmoun);
                            // log.debug({title:'dataSum', details:{oldAmount:oldAmount, sumAmount:sumAmount}});
                            var newAmount = (oldAmount) + (sumAmount);
                            var oldCant = Number(dataItems[itemData.itemId].itemQuan);
                            var sumCant = Number(itemData.itemQuan);
                            var newCant = Number(oldCant + sumCant);
                            // log.debug({title:'Ya existe el item sumar', details:{oldAmount: oldAmount, sumAmount: sumAmount, newAmount: newAmount}});
                            dataItems[itemData.itemId].itemAmoun = newAmount;
                            dataItems[itemData.itemId].itemQuan = newCant;
                        }else{
                            // log.debug({title:'No existe el item', details:'Agregar item'});
                            dataItems[itemData.itemId] = itemData;
                        }
                    }
                }
                log.debug({title:'dataItems', details:dataItems});
                var groupInfo = {};
                var itemsIds = Object.keys(dataItems);
                for (var itemLine = 0; itemLine < itemsIds.length; itemLine++) {
                    var itemData = dataItems[itemsIds[itemLine]].itemAmoun;
                    itemData = format.format({
                        value: itemData,
                        type: format.Type.CURRENCY2
                    });
                    dataItems[itemsIds[itemLine]].itemAmoun = itemData;
                }
                for (var itemLine = 0; itemLine < itemsIds.length; itemLine++) {
                    var itemInfo = dataItems[itemsIds[itemLine]];
                    if (groupInfo[itemInfo.itemCategory]) {
                        // log.debug({title:'Existe el grupo de esa categoria', details:'Existe categoria: ' + itemInfo.itemCategory});
                        groupInfo[itemInfo.itemCategory].push(itemInfo);
                    }else{
                        // log.debug({title:'NO Existe el grupo de esa categoria', details:'agregar categoria: ' + itemInfo.itemCategory});
                        groupInfo[itemInfo.itemCategory] = [itemInfo];
                    }
                }
                dataReturn.sucess = true;
                dataReturn.data = groupInfo;
            } catch (error) {
                log.error({title:'groupInformation', details:error});
                dataReturn.sucess = false;
                dataReturn.error = 'Error sorting data.';
            }
            return dataReturn;
        }

        /**
         * The function builds a JSON object containing general information, invoice information, and
         * item information.
         * @param generalInfo - An object containing general information about the customer or company,
         * such as name, address, and contact information.
         * @param itemsInfo - It is an object containing information about the items in the invoice.
         * The keys of the object are the item IDs and the values are arrays of objects containing
         * information about each item, such as the item name, quantity, price, and total.
         * @param invoiceInfo - The invoiceInfo parameter is an object containing information about
         * invoices, with the invoice IDs as keys and the invoice data (invoiceNum, invoiceTotal,
         * invoiceDate) as values.
         * @returns an object with three properties: "success", "error", and "data". The "success"
         * property is a boolean indicating whether the function executed successfully or not. The
         * "error" property is a string containing an error message if the function encountered an
         * error, otherwise it is an empty string. The "data" property is an object containing the data
         * that was built by the function
         */
        function buildDataPDF(generalInfo, itemsInfo, invoiceInfo) {
            var dataReturn = {sucess: false, error: '', data: ''};
            try {
                log.debug({title:'generalInfo', details:generalInfo});
                log.debug({title:'itemsInfo', details:itemsInfo});
                log.debug({title:'invoiceInfo', details:invoiceInfo});
                var datosJson = generalInfo;
                datosJson.invoices = [];
                var invoicesIds = Object.keys(invoiceInfo);
                for (var index = 0; index < invoicesIds.length; index++) {
                    var dataInvoice = invoiceInfo[invoicesIds[index]];
                    datosJson.invoices.push({docNum: dataInvoice.invoiceNum, total: dataInvoice.invoiceTotal, date: dataInvoice.invoiceDate});
                }
                datosJson.items = [];
                var itemsIds = Object.keys(itemsInfo);
                for (var index = 0; index < itemsIds.length; index++) {
                    var categoryInfo = itemsInfo[itemsIds[index]];
                    for (var lineCate = 0; lineCate < categoryInfo.length; lineCate++) {
                        datosJson.items.push(categoryInfo[lineCate]);
                    }
                }
                dataReturn.sucess = true;
                dataReturn.data = datosJson;
            } catch (error) {
                log.error({title:'buildDataPDF', details:error});
                dataReturn.sucess = false;
                dataReturn.error = error;
            }
            return dataReturn;
        }

        return {onRequest}

    });
