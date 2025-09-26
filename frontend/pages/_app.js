import AppLayout from "../components/Layout";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  // Check if the component opts out of the default layout
  const useLayout = Component.useLayout !== false;

  return useLayout ? (
    <AppLayout>
      <Component {...pageProps} />
    </AppLayout>
  ) : (
    <Component {...pageProps} />
  );
}

export default MyApp;
