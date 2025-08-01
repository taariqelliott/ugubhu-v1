import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";

export default function Home() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center flex-col px-5 gap-2">
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button color="default">Default</Button>
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button color="success">Success</Button>
        <Button color="warning">Warning</Button>
        <Button color="danger">Danger</Button>
      </div>
      <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
        <Input label="Email" type="email" />
      </div>
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
        onReset={() => setAction("reset")}
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));

          setAction(`submit ${JSON.stringify(data)}`);
        }}
      >
        <Input
          isRequired
          errorMessage="Please enter a valid username"
          label="Username"
          labelPlacement="outside"
          name="username"
          placeholder="Enter your username"
          type="text"
        />

        <Input
          isRequired
          errorMessage="Please enter a valid email"
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="Enter your email"
          type="email"
        />
        <div className="flex gap-2 justify-between w-full">
          <Button color="primary" type="submit">
            Submit
          </Button>
          <Button type="reset" color="danger" variant="flat">
            Reset
          </Button>
        </div>
        {action !== "reset" && action !== null && (
          <div className="text-small text-default-500">
            Action: <code>{action}</code>
          </div>
        )}
      </Form>
    </div>
  );
}
