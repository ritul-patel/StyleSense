"use client";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { PRODUCTS } from "@/data/products";

function ProductsContent() {
  const validProducts = PRODUCTS.filter((p) => p.name);
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Products</h1>
            <p className="text-sm text-gray-500 mt-1">{validProducts.length} products in catalog</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
            + Add Product
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Brand</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Price</th>
              </tr>
            </thead>
            <tbody>
              {validProducts.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-[#1b1c1b] max-w-xs truncate">{p.name}</td>
                  <td className="px-6 py-3 text-gray-600">{p.brand || "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{p.category}</td>
                  <td className="px-6 py-3 font-semibold">₹{p.price.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  return (<RequireAdmin><ProductsContent /></RequireAdmin>);
}
