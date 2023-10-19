import React from "react";
import { Suspense } from "react";
const Routes = React.lazy(() => import('./Routes'));

const App = () => {
  return (
    <div className="min-h-[100vh] font-primary bg-neutral_white">
      <Suspense fallback={<p>Loading...</p>}>
        <Routes />
      </Suspense>
    </div>
  );
};

export default App;
