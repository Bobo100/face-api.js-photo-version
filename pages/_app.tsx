import { Provider } from 'react-redux';
import '../styles/global.scss'
import 'tailwindcss/tailwind.css'
import {store} from '../components/redux/store/store';

interface AppProps {
  Component: React.ComponentType;
  pageProps: any;
}
function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  )
}

export default App