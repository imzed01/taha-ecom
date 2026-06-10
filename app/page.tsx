"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  DollarSign,
  Package,
  Star,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Headphones,
  Award,
  Rocket,
  Heart,
  Mail,
  MapPin,
  Handshake,
  Target,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="relative z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Essbyebay
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <button className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20"></div>
        <div className="relative container-responsive py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
            >
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6">
              Ess By Ebay
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
              The ultimate admin-managed Essbyebay platform where sellers focus
              on what they do best - growing their business
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            >
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg">
                  Get Started Now
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Statistics Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                50k+
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Active Sellers
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-success rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                10M+
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Products Sold
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-warning rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                $2M+
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Total Revenue
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                4.9/5
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Satisfaction Rate
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Why Choose Essbyebay?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Our platform combines the best of both worlds - powerful admin
              management with seller-focused tools for maximum success
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16"
          >
            <motion.div
              className="card p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Admin Managed
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Centralized product management and order processing with full
                control over the platform
              </p>
            </motion.div>
            <motion.div
              className="card p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-success rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Seller Focused
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Sellers pick products and earn commissions while we handle the
                technical details
              </p>
            </motion.div>
            <motion.div
              className="card p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Secure Payments
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Built-in wallet system with secure transactions and real-time
                tracking
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-secondary/5 to-primary/5">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Simple, efficient, and profitable - our 3-step process makes
              selling easy
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  1
                </span>
                <div className="absolute -right-2 sm:-right-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-8 h-0.5 bg-primary hidden md:block"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Sign Up & Verify
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create your seller account and get verified by our admin team
                within 24 hours
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-success rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  2
                </span>
                <div className="absolute -right-2 sm:-right-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-8 h-0.5 bg-success hidden md:block"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Pick Products
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Browse our curated product catalog and select items to sell with
                competitive pricing
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  3
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                Start Earning
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Begin selling products and earn commissions on every successful
                sale
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Powerful Features
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Everything you need to succeed in online selling
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Optimized performance for the best user experience",
                color: "gradient-warning",
              },
              {
                icon: Lock,
                title: "Secure & Safe",
                description: "Bank-level security for all transactions",
                color: "gradient-success",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Comprehensive insights and reporting",
                color: "gradient-primary",
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                description: "Round-the-clock customer support",
                color: "gradient-secondary",
              },
              {
                icon: Globe,
                title: "Global Reach",
                description: "Sell to customers worldwide",
                color: "gradient-primary",
              },
              {
                icon: Award,
                title: "Quality Assured",
                description: "Curated products from verified suppliers",
                color: "gradient-success",
              },
              {
                icon: Rocket,
                title: "Easy Setup",
                description: "Get started in minutes, not days",
                color: "gradient-warning",
              },
              {
                icon: Heart,
                title: "Customer Love",
                description: "Built with customer satisfaction in mind",
                color: "gradient-danger",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="card p-6 text-center hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Branding & Collaborations Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Trusted by Leading Brands
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              We partner with world-class brands and suppliers to bring you the
              best products
            </p>
          </motion.div>

          {/* Brand Logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 mb-12"
          >
            {[
              {
                name: "Nike",
                logo: "data:image/png;base64,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",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Apple",
                logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Samsung",
                logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Adidas",
                logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Sony",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNPTlk8L3RleHQ+Cjwvc3ZnPgo=",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Google",
                logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Microsoft",
                logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Amazon",
                logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Coca-Cola",
                logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "McDonald's",
                logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Starbucks",
                logo: "https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
              {
                name: "Tesla",
                logo: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png",
                bgColor: "bg-white",
                borderColor: "border-gray-200",
              },
            ].map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex items-center justify-center"
              >
                <div
                  className={`w-20 h-16 sm:w-24 sm:h-20 ${brand.bgColor} ${brand.borderColor} border-2 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-2`}
                >
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={96}
                    height={80}
                    className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Collaboration Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Direct Partnerships
              </h3>
              <p className="text-muted-foreground">
                Direct relationships with manufacturers and authorized
                distributors
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 gradient-success rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Quality Assurance
              </h3>
              <p className="text-muted-foreground">
                All products are verified and quality-tested before listing
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Authentic Products
              </h3>
              <p className="text-muted-foreground">
                Guaranteed authentic products with manufacturer warranties
              </p>
            </div>
          </motion.div>

          {/* Testimonials Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16"
          >
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">
              What Our Partners Say
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Senior Brand Manager",
                  company: "Nike",
                  image:
                    "data:image/jpeg;base64,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",
                  quote:
                    "Essbyebay has revolutionized how we reach our customers. Their platform is seamless and the results speak for themselves.",
                },
                {
                  name: "Michael Chen",
                  role: "E-commerce Director",
                  company: "Apple",
                  image:
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZGRkIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0yNSAxMjBDMjUgMTIwIDQwIDEwMCA3NSAxMDBDMTEwIDEwMCAxMjUgMTIwIDEyNSAxMjBIMjVaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo=",
                  quote:
                    "The quality of service and attention to detail is outstanding. Our partnership with Essbyebay has exceeded all expectations.",
                },
                {
                  name: "Emily Rodriguez",
                  role: "Marketing Manager",
                  company: "Samsung",
                  image:
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZGRkIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0yNSAxMjBDMjUgMTIwIDQwIDEwMCA3NSAxMDBDMTEwIDEwMCAxMjUgMTIwIDEyNSAxMjBIMjVaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo=",
                  quote:
                    "Working with Essbyebay has been a game-changer for our brand. The platform's capabilities are truly impressive.",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Get in Touch
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Have questions? We&apos;re here to help. Contact our support team
              for assistance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card p-8 sm:p-12 shadow-xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Contact Support
                </h3>
                <p className="text-muted-foreground">
                  Send us an email and we&apos;ll get back to you within 24
                  hours
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-4 p-4 bg-primary/10 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                  <span className="text-lg font-medium text-foreground">
                    support@essbyebay.store
                  </span>
                </div>

                <div className="flex justify-center">
                  <a
                    href="mailto:support@essbyebay.store?subject=Support Request - Essbyebay"
                    className="w-full sm:w-auto"
                  >
                    <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Send Email
                    </button>
                  </a>
                </div>

                <div className="text-center pt-6 border-t border-border">
                  {/* <p className="text-sm text-muted-foreground mb-4">
                    You can also reach us through:
                  </p> */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {/* <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        +1 (555) 123-4567
                      </span>
                    </div> */}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        24/7 Support
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
              Join thousands of successful sellers who trust Essbyebay to grow
              their business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center">
                  Login
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-secondary text-white rounded-xl font-semibold hover:bg-secondary/90 transition-all transform hover:scale-105 shadow-lg">
                  Sign Up Now
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-card border-t border-border">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Sparkles className="w-6 h-6 text-primary mr-2" />
                <span className="text-xl font-bold text-foreground">
                  Essbyebay
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering sellers with the best Essbyebay platform
              </p>
            </div>

            <div className="text-center md:text-left">
              <h3 className="font-semibold text-foreground mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/store"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Store
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Become a Seller
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Track Order
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Seller Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Join as Seller
                  </Link>
                </li>
                <li>
                  <Link
                    href="/store"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Customer Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/store"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>support@essbyebay.store</span>
                </div>
                {/* <div className="flex items-center justify-center md:justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div> */}
                <div className="flex items-center justify-center md:justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Global Platform</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Essbyebay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
