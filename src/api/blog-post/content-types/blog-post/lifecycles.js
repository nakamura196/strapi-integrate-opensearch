module.exports = {
    async afterCreate(event){
        if (event?.result?.publishedAt)
        {
            strapi.entityService.create('api::search-indexing-request.search-indexing-request', 
            {
                data: {
                    item_id: event.result.id,
                    collection_name: event.model.singularName,
                    indexing_status: "To be done",
                    indexing_request_type: "Add to index",
                    full_site_indexing: false
                }
            });
        }
    }, 
    async afterUpdate(event){
        if (event?.result?.publishedAt)
        {
            strapi.entityService.create('api::search-indexing-request.search-indexing-request', 
            {
                data: {
                    item_id: event.result.id,
                    collection_name: event.model.singularName,
                    indexing_status: "To be done",
                    indexing_request_type: "Add to index",
                    full_site_indexing: false
                }
            });
        }
    }, 
    async afterDelete(event){
        strapi.entityService.create('api::search-indexing-request.search-indexing-request', 
        {
            data: {
                item_id: event.result.id,
                collection_name: event.model.singularName,
                indexing_status: "To be done",
                indexing_request_type: "Delete from index",
                full_site_indexing: false
            }
        });        
    }
}
