import React from 'react'
import Signup from '../components/auth/Signup'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <main className="flex min-h-screen w-full font-[var(--font-rubik)]">
            <div className="w-1/2 lg:flex hidden items-center justify-center relative overflow-hidden">
                <div className='bg-[var(--secondary-color)] w-[350px] h-screen rounded-tl-[394px] rounded-tr-[394px] translate-y-20'>
                    <div className="relative translate-x-2 w-[480px] h-[510px]">
                        <Image src="/auth-illustration/signup-illustration.svg" alt="signup illustration" fill sizes="510px" priority/>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-y-9 lg:w-1/2 w-full overflow-hidden">
                <h1 className="md:text-4xl text-3xl font-bold text-[#424242] text-center my-1">Create Account</h1>
                <Signup />
            </div>
    </main>
  )
}
