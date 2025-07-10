const NotConnected = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">
          Wallet non connecté
        </h2>
        <p className="text-yellow-700">
          Veuillez connecter votre wallet pour continuer.
        </p>
      </div>
    </div>
  )
}

export default NotConnected