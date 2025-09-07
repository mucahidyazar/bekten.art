export default function AdminStorePage() {
  return (
    <div className="admin-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Store Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your artwork store, products, and sales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Products Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Products
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Manage your artwork listings and inventory
          </p>
          <div className="text-2xl font-bold text-primary-500 mb-2">0</div>
          <div className="text-sm text-gray-500">Total products</div>
        </div>

        {/* Sales Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Sales
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Track your sales and revenue
          </p>
          <div className="text-2xl font-bold text-green-500 mb-2">$0</div>
          <div className="text-sm text-gray-500">Total revenue</div>
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Orders
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Manage customer orders and shipping
          </p>
          <div className="text-2xl font-bold text-blue-500 mb-2">0</div>
          <div className="text-sm text-gray-500">Pending orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
            Add Product
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
            View Sales
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            Manage Orders
          </button>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
            Store Settings
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No recent store activity to display
          </div>
        </div>
      </div>
    </div>
  )
}
