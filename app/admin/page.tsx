"use client"

import { useEffect, useState } from "react"
import { db, auth } from "../../lib/firebase"
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth"

import { Pencil } from "lucide-react"

type Category = "business" | "gigs" | "tech"

type Plan = {
  id: string
  title: string
  price: number
  category: Category
  fileKey: string
  createdAt?: any
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)

  // Upload states
  const [newTitle, setNewTitle] = useState("")
  const [newPrice, setNewPrice] = useState(10)
  const [newCategory, setNewCategory] = useState<Category>("business")
  const [file, setFile] = useState<File | null>(null)

  // ZIP bundle states
  const [bundleTitle, setBundleTitle] = useState("")
  const [bundlePrice, setBundlePrice] = useState(50)
  const [bundleFile, setBundleFile] = useState<File | null>(null)
  const [bundleProgress, setBundleProgress] = useState(0)
  const [bundleR2Path, setBundleR2Path] = useState<string>(
    "plans/All In One Business Plans Bundle.zip" // default R2 path
  )

  // ================= AUTH =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (u) {
        fetchPlans()
        fetchPayments()
      }
    })
    return () => unsubscribe()
  }, [])

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      alert("Login failed")
    }
  }

  // ================= FETCH =================
  const fetchPlans = async () => {
    const q = query(collection(db, "plans"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    const data: Plan[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Plan, "id">),
    }))
    setPlans(data)
  }

  const fetchPayments = async () => {
    const snapshot = await getDocs(collection(db, "payments"))
    setPayments(snapshot.docs.map((d) => d.data()))
  }

  // ================= UPLOAD NEW DOCUMENT =================
  const uploadNewPlan = async () => {
    if (!file || !newTitle) {
      alert("Fill all fields")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) return alert("Upload failed")

    await addDoc(collection(db, "plans"), {
      title: newTitle,
      price: newPrice,
      category: newCategory,
      fileKey: data.key,
      createdAt: serverTimestamp(),
    })

    setNewTitle("")
    setNewPrice(10)
    setFile(null)
    fetchPlans()
    alert("Uploaded successfully")
  }

  // ================= ZIP BUNDLE MANAGEMENT =================
  const saveBundleRecord = async () => {
    if (!bundleTitle || !bundleR2Path) {
      alert("Fill all fields")
      return
    }

    await addDoc(collection(db, "bundle"), {
      title: bundleTitle,
      price: bundlePrice,
      category: "business",
      fileKey: bundleR2Path,
      createdAt: serverTimestamp(),
    })

    setBundleTitle("")
    setBundlePrice(50)
    alert("Bundle record saved successfully")
  }

  const replaceBundleFile = async () => {
    if (!bundleFile) {
      alert("Select a ZIP file to replace")
      return
    }

    const formData = new FormData()
    formData.append("file", bundleFile)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setBundleProgress(percent)
      }
    }

    xhr.onload = async () => {
      if (xhr.status !== 200) {
        console.error("Upload error:", xhr.responseText)
        alert("Upload failed")
        setBundleProgress(0)
        return
      }

      let data
      try {
        data = JSON.parse(xhr.responseText)
      } catch (err) {
        console.error("Invalid JSON response:", xhr.responseText)
        alert("Server returned invalid response")
        setBundleProgress(0)
        return
      }

      setBundleR2Path(data.key)
      setBundleFile(null)
      setBundleProgress(0)
      alert("Bundle file replaced successfully")
    }

    xhr.open("POST", "/api/upload")
    xhr.send(formData)
  }

  // ================= DELETE =================
  const deletePlan = async (plan: Plan) => {
    if (!confirm("Delete this document?")) return

    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: plan.fileKey }),
    })

    await deleteDoc(doc(db, "plans", plan.id))
    fetchPlans()
  }

  // ================= REPLACE FILE =================
  const replaceFile = async (plan: Plan, newFile: File) => {
    const formData = new FormData()
    formData.append("file", newFile)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) return alert("Replace failed")

    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: plan.fileKey }),
    })

    await updateDoc(doc(db, "plans", plan.id), {
      fileKey: data.key,
    })

    fetchPlans()
    alert("File replaced")
  }

  // ================= UPDATE =================
  const updatePlan = async (plan: Plan) => {
    await updateDoc(doc(db, "plans", plan.id), {
      title: plan.title,
      price: plan.price,
      category: plan.category,
    })

    setEditingId(null)
    alert("Updated")
  }

  // ================= STATS =================
  const filtered = plans.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = payments.reduce(
    (acc, p) => acc + (p.amount || 0),
    0
  )

  // ================= LOGIN =================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
          <h2 className="text-xl font-semibold">Admin Login</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />

          <button
            onClick={login}
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-100">

      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-xl font-bold">Beezna Admin</h2>
        <button
          onClick={() => signOut(auth)}
          className="text-red-600 text-sm"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-10 space-y-10">

        {/* ZIP BUNDLE SECTION */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-semibold">Business Plan Bundle</h2>

          <input
            placeholder="Bundle Title"
            value={bundleTitle}
            onChange={(e) => setBundleTitle(e.target.value)}
            className="p-2 border rounded w-full"
          />

          <input
            type="number"
            placeholder="Bundle Price"
            value={bundlePrice}
            onChange={(e) => setBundlePrice(Number(e.target.value))}
            className="p-2 border rounded w-full"
          />

          {/* Drag & Drop / File Input for replacing existing ZIP */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dropped = e.dataTransfer.files[0]
              if (dropped) setBundleFile(dropped)
            }}
            className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center"
          >
            {bundleFile ? bundleFile.name : `Current ZIP: ${bundleR2Path}`}
          </div>

          <input
            type="file"
            accept=".zip"
            onChange={(e) => setBundleFile(e.target.files?.[0] || null)}
          />

          {bundleProgress > 0 && (
            <div className="w-full bg-gray-200 rounded">
              <div
                className="bg-blue-600 text-xs text-white text-center p-1 rounded"
                style={{ width: `${bundleProgress}%` }}
              >
                {bundleProgress}%
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={saveBundleRecord}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              Save Bundle Record
            </button>

            {bundleFile && (
              <button
                onClick={replaceBundleFile}
                className="bg-blue-600 text-white px-6 py-2 rounded"
              >
                Replace ZIP File
              </button>
            )}
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${bundleR2Path}`}
            target="_blank"
            className="text-blue-600"
          >
            Preview Current Bundle
          </a>
        </div>

        {/* ORIGINAL UPLOAD SECTION REMAINS UNCHANGED */}
        {/* ... (rest of your existing page stays the same) */}

        {/* UPLOAD SECTION */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-semibold">Upload New Document</h2>

          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="p-2 border rounded"
            />

            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="p-2 border rounded"
            />

            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as Category)
              }
              className="p-2 border rounded"
            >
              <option value="business">Business</option>
              <option value="gigs">Gigs</option>
              <option value="tech">Tech</option>
            </select>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dropped = e.dataTransfer.files[0]
              if (dropped) setFile(dropped)
            }}
            className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center"
          >
            {file ? file.name : "Drag & drop PDF here"}
          </div>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <button
            onClick={uploadNewPlan}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            Upload
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Total Documents</p>
            <h3 className="text-2xl font-bold">{plans.length}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Real Revenue (KES)</p>
            <h3 className="text-2xl font-bold">{totalRevenue}</h3>
          </div>
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        {/* TABLE LIST */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Price</th>
                <th className="p-3">Category</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((plan) => (
                <tr key={plan.id} className="border-t">

                  <td className="p-3">
                    {editingId === plan.id ? (
                      <input
                        value={plan.title}
                        onChange={(e) =>
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === plan.id
                                ? { ...p, title: e.target.value }
                                : p
                            )
                          )
                        }
                        className="border p-1"
                      />
                    ) : (
                      plan.title
                    )}
                  </td>

                  <td className="p-3">
                    {editingId === plan.id ? (
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) =>
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === plan.id
                                ? { ...p, price: Number(e.target.value) }
                                : p
                            )
                          )
                        }
                        className="border p-1 w-20"
                      />
                    ) : (
                      plan.price
                    )}
                  </td>

                  <td className="p-3">
                    {editingId === plan.id ? (
                      <select
                        value={plan.category}
                        onChange={(e) =>
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === plan.id
                                ? { ...p, category: e.target.value as Category }
                                : p
                            )
                          )
                        }
                        className="border p-1"
                      >
                        <option value="business">Business</option>
                        <option value="gigs">Gigs</option>
                        <option value="tech">Tech</option>
                      </select>
                    ) : (
                      plan.category
                    )}
                  </td>

                  <td className="p-3 space-x-3">

                    <button
                      onClick={() => setEditingId(plan.id)}
                    >
                      <Pencil size={16} />
                    </button>

                    {editingId === plan.id && (
                      <button
                        onClick={() => updatePlan(plan)}
                        className="text-green-600"
                      >
                        Save
                      </button>
                    )}

                    <a
                      href={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${plan.fileKey}`}
                      target="_blank"
                      className="text-blue-600"
                    >
                      Preview
                    </a>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const newFile = e.target.files?.[0]
                        if (newFile) replaceFile(plan, newFile)
                      }}
                    />

                    <button
                      onClick={() => deletePlan(plan)}
                      className="text-red-600"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}