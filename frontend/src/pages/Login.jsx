import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useDispatch } from "react-redux"
import { loginSuccess } from "@/store/slices/authSlice"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authApi } from "@/services/auth.api"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Users, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      dispatch(loginSuccess({ token: data.data.accessToken, user: data.data.user }))
      toast.success("Login successful!")
      navigate("/dashboard", { replace: true })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed")
    }
  })

  const onSubmit = (values) => {
    loginMutation.mutate(values)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-card rounded-3xl shadow-2xl overflow-hidden border border-border/50">
        
        {/* Left Side - Hero / Branding */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-primary/5 dark:bg-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-0"></div>
          
          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">MeetWithUs</span>
          </div>

          <div className="relative z-10 mt-20 mb-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              Unlock the power of <span className="text-primary">AI-driven</span> meetings.
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Automatically generate agendas, summaries, and action items for your team workspaces in seconds.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 w-fit px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4" /> 
              MeetWithUs AI Assistant 2.0 is live
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-muted-foreground">
            © {new Date().getFullYear()} MeetWithUs Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-card relative">
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground">
                Enter your email and password to sign in.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          className="h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-semibold">Password</FormLabel>
                        <Link to="#" className="text-sm font-medium text-primary hover:underline transition-all">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            className="h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all pr-12 text-foreground"
                            {...field} 
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full h-12 text-md font-semibold mt-4 group transition-all" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : (
                    <>
                      Sign in to workspace
                      <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline transition-colors">
                Sign up for free
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
