let dtPromise = null
export const getDatatable = async () => {
    if (!dtPromise) {
        try {
            dtPromise = import('https://code.jquery.com/jquery-3.7.0.min.js').then(() => {
                import('https://cdn.datatables.net/v/bm/dt-1.13.8/r-2.5.0/sb-1.6.0/datatables.min.js');
            })

        } catch (error) {
            dtPromise = null;
            throw error
        }
    }
    return dtPromise
}