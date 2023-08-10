// component/redux/slice/asyncSlice.tsx
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { asyncInitialState } from "../state/stateType"
import { RootState } from "../store/store"

export const fetchFirstData = createAsyncThunk(
    'first/fetchData',
    async () => {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
        const data = await response.json()
        return data
    }
)

export const asyncSlice = createSlice({
    name: 'asyncData',
    initialState: asyncInitialState,
    reducers: {
        // 當然也可以不要有，如果你只是想要fetch資料到store中的話
        setDataTitle: (state, action: PayloadAction<string>) => {
            state.title = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFirstData.pending, (state) => {
                state.isLoading = true
            })
            .addCase(fetchFirstData.fulfilled, (state, action) => {
                state.isLoading = false
                state.userId = action.payload.userId
                state.id = action.payload.id
                state.title = action.payload.title
                state.completed = action.payload.completed
            })
            .addCase(fetchFirstData.rejected, (state, action) => {
                state.title = "error"
                state.isLoading = false
            })
    }
})
export const { setDataTitle } = asyncSlice.actions

export const selectDataTitle = (state: RootState) => state.async.title

export default asyncSlice.reducer