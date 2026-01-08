"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { FeatureCard } from "@/components/feature-card"
import { Button } from "@/components/ui/button"
import { Pill } from "@/components/pill"
import { GL } from "@/components/gl"
import { Leva } from "leva"
import { useState } from "react"

export default function Home() {
  const [hovering, setHovering] = useState(false)

  return (
    <div className="bg-background text-foreground">
      <Header />
      <Leva hidden />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex flex-col justify-between pt-32 pb-16">
        <GL hovering={hovering} />

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4">
          <Pill className="mb-6">BETA RELEASE</Pill>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient text-balance">
            Unlock your <br />
            <i className="font-light">future</i> growth
          </h1>
          <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[540px] leading-relaxed">
            Skal Ventures is a cutting-edge blockchain investment platform that democratizes access to sophisticated
            investment strategies. Swap currencies, invest for growth, and earn passive income through staking—all in
            one secure ecosystem.
          </p>

          <Link className="contents" href="/signin">
            <Button className="mt-14" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
              [Get Started]
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 md:px-8 lg:px-12 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-sentient mb-4">Powerful Features</h2>
            <p className="font-mono text-foreground/60 max-w-2xl mx-auto">
              Everything you need to manage your blockchain investments and grow your wealth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Swap Assets"
              description="Seamlessly exchange between Naira, USDT, and other cryptocurrencies with real-time conversion rates and minimal fees."
              icon="⚡"
              highlight
            />
            <FeatureCard
              title="Invest Strategically"
              description="Choose from Conservative, Balanced, or Growth investment strategies tailored to your risk tolerance and financial goals."
              icon="📈"
            />
            <FeatureCard
              title="Stake & Earn"
              description="Earn daily rewards by staking your USDT, USDC, or ETH in our secure staking pools with competitive APY rates."
              icon="💰"
            />
            <FeatureCard
              title="Real-Time Analytics"
              description="Track your portfolio performance with detailed analytics, charts, and insights into your investment returns."
              icon="📊"
            />
            <FeatureCard
              title="Secure & Transparent"
              description="Your assets are protected with industry-leading security protocols and full transparency in all transactions."
              icon="🔒"
            />
            <FeatureCard
              title="24/7 Support"
              description="Access our dedicated support team anytime to help you with your investments and answer any questions."
              icon="🤝"
            />
          </div>
        </div>
      </section>

      {/* Investment Strategies Table */}
      <section className="py-24 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-sentient mb-4">Investment Strategies</h2>
            <p className="font-mono text-foreground/60 max-w-2xl mx-auto">
              Choose the strategy that aligns with your financial goals and risk tolerance
            </p>
          </div>

          <div className="border border-border bg-background p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-sentient text-sm">Strategy</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Annual APY</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Risk Level</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Min. Investment</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Lock Period</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { strategy: "Conservative", apy: "8.5%", risk: "Low", min: "$100", lock: "30 days" },
                  { strategy: "Balanced", apy: "14.2%", risk: "Medium", min: "$500", lock: "60 days" },
                  { strategy: "Growth", apy: "22.8%", risk: "High", min: "$1,000", lock: "90 days" },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono text-sm text-foreground">{row.strategy}</td>
                    <td className="py-4 px-4 font-mono text-sm text-primary font-medium">{row.apy}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground/70">{row.risk}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground/70">{row.min}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground/70">{row.lock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Staking Pools Table */}
      <section className="py-24 px-4 md:px-8 lg:px-12 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-sentient mb-4">Staking Pools</h2>
            <p className="font-mono text-foreground/60 max-w-2xl mx-auto">
              Earn passive income by staking your assets in our secure pools
            </p>
          </div>

          <div className="border border-border bg-background p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-sentient text-sm">Asset</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Daily Reward</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Total Staked</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Unstake Cooldown</th>
                  <th className="text-left py-4 px-4 font-sentient text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { asset: "USDT", reward: "0.05%", staked: "$2.5M", cooldown: "7 days", status: "Active" },
                  { asset: "USDC", reward: "0.048%", staked: "$1.8M", cooldown: "7 days", status: "Active" },
                  { asset: "ETH", reward: "0.12%", staked: "$850K", cooldown: "14 days", status: "Active" },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono text-sm text-primary font-medium">{row.asset}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground">{row.reward}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground/70">{row.staked}</td>
                    <td className="py-4 px-4 font-mono text-sm text-foreground/70">{row.cooldown}</td>
                    <td className="py-4 px-4 font-mono text-sm text-green-500">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-sentient mb-4">Why Choose Skal Ventures</h2>
          </div>

          <div className="space-y-8 font-mono text-foreground/80 leading-relaxed mb-16">
            <div className="border border-border bg-background/50 p-8">
              <h3 className="font-sentient text-lg text-primary mb-3">Democratized Access</h3>
              <p>
                We believe everyone should have access to sophisticated investment strategies. Our platform removes
                barriers and makes blockchain investing accessible to everyone, from beginners to experienced traders.
              </p>
            </div>

            <div className="border border-border bg-background/50 p-8">
              <h3 className="font-sentient text-lg text-primary mb-3">Security First</h3>
              <p>
                Your assets are protected with industry-leading security protocols, multi-signature wallets, and regular
                security audits. We prioritize your peace of mind above all else.
              </p>
            </div>

            <div className="border border-border bg-background/50 p-8">
              <h3 className="font-sentient text-lg text-primary mb-3">Transparent Operations</h3>
              <p>
                Full transparency in all transactions and operations. Track every swap, investment, and reward in
                real-time with our comprehensive analytics dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center border border-border bg-background p-8">
              <div className="text-4xl font-sentient text-primary mb-3">$500M+</div>
              <p className="font-mono text-sm text-foreground/60">Assets Under Management</p>
            </div>
            <div className="text-center border border-border bg-background p-8">
              <div className="text-4xl font-sentient text-primary mb-3">50K+</div>
              <p className="font-mono text-sm text-foreground/60">Active Users</p>
            </div>
            <div className="text-center border border-border bg-background p-8">
              <div className="text-4xl font-sentient text-primary mb-3">99.9%</div>
              <p className="font-mono text-sm text-foreground/60">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 md:px-8 lg:px-12 bg-background/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-sentient mb-4">Get In Touch</h2>
          <p className="font-mono text-foreground/60 mb-12">
            Have questions? We'd love to hear from you. Reach out to our team.
          </p>

          <div className="space-y-4 font-mono text-sm mb-12">
            <p>
              Email:{" "}
              <a href="mailto:hello@skalventures.com" className="text-primary hover:text-primary/80 transition-colors">
                hello@skalventures.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a href="tel:+1234567890" className="text-primary hover:text-primary/80 transition-colors">
                +1 (234) 567-890
              </a>
            </p>
            <p>
              Address: <span className="text-foreground/60">123 Blockchain Street, Web3 City, BC 12345</span>
            </p>
          </div>

          <Link className="contents" href="/signin">
            <Button>[Get Started Today]</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-sentient text-lg mb-4">Product</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground/60">
                <li>
                  <Link href="#features" className="hover:text-foreground/100 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="hover:text-foreground/100 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-foreground/100 transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-sentient text-lg mb-4">Company</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground/60">
                <li>
                  <Link href="#about" className="hover:text-foreground/100 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-foreground/100 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-sentient text-lg mb-4">Legal</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground/60">
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Disclaimer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-sentient text-lg mb-4">Follow Us</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground/60">
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground/100 transition-colors">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center font-mono text-sm text-foreground/60">
            <p>&copy; 2025 Skal Ventures. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
