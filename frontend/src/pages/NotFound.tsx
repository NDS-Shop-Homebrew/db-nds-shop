import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-black to-indigo-900  px-4">
      <h1 className="text-9xl font-extrabold mb-6 select-none">404</h1>
      <p className="text-2xl mb-4">Oups ! Page non trouvée.</p>
      <p className="mb-8 max-w-md text-center text-gray-300">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md  font-semibold transition"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
