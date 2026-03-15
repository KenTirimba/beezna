"use client"
import { useEffect, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../lib/firebase"
import PlanCard from "./components/PlanCard"
import { LayoutGrid, List } from "lucide-react"

type Plan = {
  id: string
  title: string
  price: number
  fileKey: string
  createdAt: string
  category: "business" | "gigs" | "tech" | "plugs"
  bestSelling?: boolean
}

type Bundle = {
  title: string
  fileKey: string
  price: number
}

type SortOption = "newest" | "price-low" | "price-high" | "title"

export default function HomePage() {

  const [plans, setPlans] = useState<Plan[]>([])
  const [bundle, setBundle] = useState<Bundle | null>(null)

  const [activeCategory, setActiveCategory] =
    useState<"best" | "business" | "gigs" | "tech" | "plugs">("best")

  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [layout, setLayout] = useState<"grid" | "list">("grid")

  useEffect(() => {

    const fetchPlans = async () => {

      const q = query(
        collection(db, "plans"),
        orderBy("createdAt", "desc")
      )

      const snapshot = await getDocs(q)

      const plansData: Plan[] = snapshot.docs.map((doc) => {

        const data = doc.data()
        const createdAt = data.createdAt

        return {
          id: doc.id,
          title: data.title,
          price: data.price,
          fileKey: data.fileKey,
          category: data.category || "business",
          bestSelling: data.bestSelling || false,
          createdAt:
            createdAt?.toDate?.().toISOString() ||
            new Date().toISOString(),
        }

      })

      setPlans(plansData)

    }

    const fetchBundle = async () => {

      const snap = await getDocs(collection(db, "bundle"))

      if (!snap.empty) {
        const data = snap.docs[0].data() as Bundle
        setBundle(data)
      }

    }

    fetchPlans()
    fetchBundle()

  }, [])

  // FILTER

  let filteredPlans = plans.filter((plan) => {

    const matchesSearch = plan.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    if (activeCategory === "best") {
      return plan.bestSelling && matchesSearch
    }

    const matchesCategory = plan.category === activeCategory

    return matchesCategory && matchesSearch

  })

  // SORT

  filteredPlans = [...filteredPlans].sort((a, b) => {

    if (sortBy === "price-low") return a.price - b.price
    if (sortBy === "price-high") return b.price - a.price
    if (sortBy === "title") return a.title.localeCompare(b.title)

    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    )

  })

  return (

    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* HERO */}

        <section className="mb-10 text-center">

          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-3">
            Beezna
            <span className="text-3xl align-super ml-1 text-indigo-600 font-bold">+</span>
          </h1>

          <p className="text-base text-indigo-700 max-w-2xl mx-auto">
            Premium digital products to help you start,
            grow income streams, and build profitable ventures.
          </p>

        </section>

        {/* PURCHASE DISCLAIMER */}

        <div className="max-w-xl mx-auto mb-10 bg-yellow-50 border border-yellow-300 text-yellow-900 text-xs rounded-xl p-4 text-center shadow-sm">
          ⚠️ Download links expire after 24hrs of purchase
        </div>

        {/* SEARCH */}

        <div className="mb-8 max-w-xl mx-auto">

          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 border border-indigo-200 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          />

        </div>

        {/* CATEGORY */}

        <div className="flex justify-center mb-8">

          <div className="flex gap-3 p-1 bg-white rounded-full shadow-sm border border-indigo-200">

            {[
              { key: "best", label: "Best Selling" },
              { key: "business", label: "Business Plans" },
              { key: "gigs", label: "Online Gigs" },
              { key: "tech", label: "Tech & Web Dev" },
              { key: "plugs", label: "Plugs" },
            ].map((cat) => (

              <button
                key={cat.key}
                onClick={() =>
                  setActiveCategory(
                    cat.key as any
                  )
                }
                className={`px-5 py-2 text-xs font-semibold rounded-full transition ${
                  activeCategory === cat.key
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {cat.label}
              </button>

            ))}

          </div>

        </div>

        {/* SORT + LAYOUT */}

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as SortOption)
            }
            className="px-4 py-2 border border-indigo-200 rounded-lg text-sm bg-white shadow-sm"
          >

            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title">Alphabetical</option>

          </select>


          <div className="flex gap-2">

            <button
              onClick={() => setLayout("grid")}
              className={`p-2 rounded-lg ${
                layout === "grid"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-indigo-200 text-indigo-700"
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setLayout("list")}
              className={`p-2 rounded-lg ${
                layout === "list"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-indigo-200 text-indigo-700"
              }`}
            >
              <List size={18} />
            </button>

          </div>

        </div>


        {/* GRID */}

        <section
          className={
            layout === "grid"
              ? "grid grid-cols-1 md:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >

          {filteredPlans.length === 0 && (

            <div className="text-center py-16 border rounded-2xl bg-white shadow-sm">

              <p className="text-indigo-600 text-sm">
                No matching documents found.
              </p>

            </div>

          )}


          {/* BUNDLE CARD */}

          {activeCategory === "business" && bundle && (

            <div className="col-span-full flex justify-center">

              <div className="relative w-full md:w-2/3 bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200 border border-yellow-300 rounded-2xl p-7 text-center shadow-xl animate-bundleFloat">

                <span className="inline-block mb-3 text-xs font-bold text-yellow-900 uppercase bg-yellow-300 px-3 py-1 rounded-full">
                  All-in-One Bundle
                </span>

                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Complete Business Plan Library
                </h3>

                <p className="text-sm text-yellow-800 mb-4">
                  150+ ready-to-use business plans across multiple industries.
                  Perfect for entrepreneurs, startups, and side hustles.
                </p>

                <p className="text-yellow-900 font-bold text-lg mb-4">
                  KES {bundle.price}
                </p>

                <PlanCard
                  plan={{
                    id: "bundle",
                    title: bundle.title,
                    price: bundle.price,
                    fileKey: bundle.fileKey,
                    category: "business",
                  }}
                  layout="grid"
                />

              </div>

            </div>

          )}


          {filteredPlans.map((plan) => (

            <PlanCard
              key={plan.id}
              plan={plan}
              layout={layout}
            />

          ))}

        </section>

      </div>


      {/* FLOAT + GLOW ANIMATION */}

      <style jsx global>{`

        @keyframes bundleFloat {

          0%,100% {
            transform: translateY(0px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          }

          50% {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(255,200,0,0.35);
          }

        }

        .animate-bundleFloat {
          animation: bundleFloat 3.5s ease-in-out infinite;
        }

      `}</style>

    </main>

  )

}