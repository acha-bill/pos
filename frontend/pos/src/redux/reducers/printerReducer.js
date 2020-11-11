const INITIAL_STATE = {
    printers: []
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_PRINTERS':
            const printers = action.payload;


            return { ...state, printers: [...printers] };

        default:
            return state;
    }
};