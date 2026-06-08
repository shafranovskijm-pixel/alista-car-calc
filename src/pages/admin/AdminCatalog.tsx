import { Car, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminCatalog = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Каталог авто</h1>
      <p className="text-muted-foreground text-sm">
        Раздел в разработке: здесь будет управление каталогом авто из Японии, Кореи и Китая
        (марка, модель, год, КПП, цена, пробег, статус: «в наличии / в пути / под заказ»),
        фотогалереи и аукционные листы.
      </p>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">Что планируется</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />Создание и редактирование карточек авто (как в «Наши работы»)</li>
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />Фильтры на публичных страницах /cars/japan, /cars/korea, /cars/china</li>
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />Кнопка «Заказать просчёт» с автоподстановкой марки/модели в заявку</li>
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />Каталог товаров из Китая с категориями</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCatalog;