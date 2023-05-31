/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @name FB - Print PDF UE
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary This script will add the Print PDF button to the Invoice Group interface
 * @copyright Tekiio México 2023
 * 
 * Client              -> Healix
 * Last modification   -> 31/05/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Print PDF UE <customscript_fb_print_pdf_invg_ue>
 */
define(['N/currentRecord', 'N/log', 'N/runtime'],
    /**
 * @param{currentRecord} currentRecord
 * @param{log} log
 * @param{runtime} runtime
 */
    (currentRecord, log, runtime) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                    var scriptObj = runtime.getCurrentScript();
                    var templateID = scriptObj.getParameter({name: 'custscript_id_template_pdf'});
                    var objRecord = scriptContext.newRecord;
                    var typeTransaction = objRecord.type;
                    var form = scriptContext.form;
                    log.audit('type transaction', typeTransaction);
                    log.audit('template id by parameter', templateID);
                    form.addButton({
                        id: 'custpage_btn_pdf_template',
                        label: 'Print PDF',
                        functionName: 'renderButton(' + templateID + ','+ objRecord.id +')'
                    });
                    form.clientScriptModulePath = './FB - Print PDF CS.js';
                }
            } catch (error) {
                log.error({title:'BeforeLoad', details:error});
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad}

    });
