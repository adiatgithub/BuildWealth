import React, { useState } from "react";
import { navigationMenuTriggerStyle } from "./ui/navigation-menu";

const Header = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const closeSheet = () => setIsSheetOpen(false);
    const renderNavItems = (isMobile = false) => (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link to={{ pathname: "/", hash: "#home" }} className={navigationMenuTriggerStyle()}>
                        Home
                    </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                    <Link to={{ pathname: "/", hash: "#home" }} className={navigationMenuTriggerStyle()}>
                        About Us
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <div className='ml-4 flex items-center gap-2'>
                <Button variant="outline" className="mr-2" asChild>
                    <Link to="/login">
                        Log In
                    </Link>
                </Button>
                <Button variant="outline" className="mr-2" asChild>
                    <Link to="/register">
                        Get Started
                    </Link>
                </Button>
            </div>
        </>
    )

    return <div>Header</div>;
}

export default Header