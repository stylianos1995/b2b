import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export type SignUpAs = "supplier" | "business";

const businessFields = [
  { name: "companyName", label: "Company name", type: "text", placeholder: "Your company" },
  { name: "email", label: "Email", type: "email", placeholder: "you@company.com" },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  { name: "industry", label: "Industry", type: "text", placeholder: "e.g. Retail, Manufacturing" },
];

const providerFields = [
  { name: "companyName", label: "Company name", type: "text", placeholder: "Your company" },
  { name: "email", label: "Email", type: "email", placeholder: "you@company.com" },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  { name: "productsOrServices", label: "Products or services", type: "text", placeholder: "What you supply" },
];

export function RegisterPage() {
  const { role, setRole } = useAuth();
  const [signUpAs, setSignUpAs] = useState<SignUpAs>(() =>
    role === "provider" ? "supplier" : "business"
  );

  const handleRoleChange = (value: SignUpAs) => {
    setSignUpAs(value);
    setRole(value === "supplier" ? "provider" : "business");
  };

  const fields = signUpAs === "supplier" ? providerFields : businessFields;
  const title = signUpAs === "supplier" ? "Sign up as Supplier" : "Sign up as Business";

  return (
    <div className="w-full max-w-lg">
      <div className="card-glass rounded-3xl p-8 shadow-soft sm:p-10">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-slate-600">
          Create your account. Choose how you will use the platform.
        </p>
        <form className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              I am a
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/50">
                <input
                  type="radio"
                  name="signUpAs"
                  value="business"
                  checked={signUpAs === "business"}
                  onChange={() => handleRoleChange("business")}
                  className="h-4 w-4 text-primary-600"
                />
                <div>
                  <span className="font-medium text-slate-800">Business</span>
                  <p className="text-xs text-slate-500">
                    Order from suppliers, manage my business
                  </p>
                </div>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/50">
                <input
                  type="radio"
                  name="signUpAs"
                  value="supplier"
                  checked={signUpAs === "supplier"}
                  onChange={() => handleRoleChange("supplier")}
                  className="h-4 w-4 text-primary-600"
                />
                <div>
                  <span className="font-medium text-slate-800">Supplier</span>
                  <p className="text-xs text-slate-500">
                    Edit products & availability
                  </p>
                </div>
              </label>
            </div>
          </div>
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="block text-sm font-medium text-slate-700"
              >
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full">
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
