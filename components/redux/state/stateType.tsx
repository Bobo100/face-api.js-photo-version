// components/redux/state/stateType.tsx
/////////////////////////////////////// 第三個State 非同步
export interface AsyncState {
    userId: number
    id: number
    title: string
    completed: boolean
    isLoading: boolean    
}

export const asyncInitialState: AsyncState = {
    userId: 0,
    id: 0,
    title: '',
    completed: true,
    isLoading: false
}