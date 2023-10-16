import Image from 'next/image'

export function EventCard() {
  return (
    <div className="flex gap-4 h-[10rem] p-2 group hover:cursor-pointer">
      <div className="text-gray-500 font-bold">
        <p className="">JUN</p>
        <div className="w-4 h-[1px] bg-gray-500" />
        <p className="text-2xl">23</p>
      </div>
      <div className="min-w-fit">
        <Image
          src="/usubaliev_1.jpg"
          alt="Bekten Usubaliev"
          width={400}
          height={400}
          className="h-full w-auto min-w-fit"
        />
      </div>
      <div className="flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-500">
            Title of the Risen Event
          </h3>
          <div className="text-xs text-gray-500">
            {/* subtitle */}
            <p>1015 Chestnut St. Philadelphia, PA 19107</p>
            <p>7:00 PM - 9:00 PM</p>
            <p>Free</p>
          </div>
        </div>

        <p className="text-xs line-clamp-2">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia
          voluptatum, quibusdam, doloribus, quod voluptate quisquam voluptatibus
          quos nemo accusamus doloremque voluptas. Quisquam voluptatibus quos
          nemo accusamus doloremque voluptas.
        </p>

        <div className="flex gap-4 text-sm font-semibold">
          {/* <button>Register</button>
            <button>Donate</button> */}
          <button className="group text-gray-500">
            View Event Details
            <p className="w-0 h-[1px] bg-gray-300 group-hover:w-full group-hover:bg-gray-500 group-hover:h-[1px] transition-all duration-300 ease-in-out"></p>
          </button>
        </div>
      </div>
    </div>
  )
}
