import imgImageBalde from "./9f7a2aa3411430c880bbfcba11a1d4a88508e43c.png";

function ImageBalde() {
  return (
    <div className="relative shrink-0 size-[70px]" data-name="Image (Balde)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageBalde} />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0 size-[70px]" data-name="Container">
      <ImageBalde />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[133px] items-start justify-center relative shrink-0 whitespace-nowrap" data-name="Container">
      <p className="font-['Montserrat:SemiBold',sans-serif] font-semibold leading-[21px] relative shrink-0 text-[14px] text-black">Balde</p>
      <p className="font-['Montserrat:Light',sans-serif] font-light leading-[16.5px] relative shrink-0 text-[#0c7c97] text-[11px]">SKU0001</p>
      <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[18px] relative shrink-0 text-[12px] text-black">Disponível: 3</p>
      <p className="font-['Montserrat:Regular',sans-serif] font-normal leading-[16.5px] relative shrink-0 text-[#0c7c97] text-[11px]">Uso recomendado: 15 dias</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#0c7c97] h-[28px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#f0f2fb] h-[28px] opacity-30 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative size-full">
        <div className="h-0 relative shrink-0 w-[10px]" data-name="Vector">
          <div className="absolute inset-[-0.67px_-6.67%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.3333 1.33333">
              <path d="M0.666667 0.666667H10.6667" id="Vector" stroke="var(--stroke-0, #323232)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center justify-center max-w-[64px] min-w-px relative" data-name="Container">
      <Button />
      <p className="font-['Montserrat:Bold',sans-serif] font-bold leading-[27px] relative shrink-0 text-[18px] text-black text-center whitespace-nowrap">0</p>
      <Button1 />
    </div>
  );
}

function Container() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-white content-stretch flex items-center justify-between left-1/2 p-[12px] rounded-[12px] top-1/2 w-[328px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#f0f2fb] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Container1 />
      <Container2 />
      <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
        <Container3 />
      </div>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <Container />
    </div>
  );
}