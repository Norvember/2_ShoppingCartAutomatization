const { Builder, By, until, Key } = require('selenium-webdriver');
const quickSleep = 2 * 1000; // 1 second

describe('Add Items to Cart Test', function () {
    this.timeout(40000);
    let driver;

    before(async function () {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function () {
        await driver.quit();
    });

    it('should add 3 random items to the cart and verify them', async function () {
        const chai = await import('chai');
        const should = chai.should();

        const searchKeyword = "laptop";
        const websiteUrl = "https://www.1a.lt";

        // Navigation to the website
        await driver.get(websiteUrl);

        // Searchbox
        const searchBox = await driver.findElement(By.css('input[name="q"]'));
        await searchBox.sendKeys(searchKeyword, Key.RETURN);

        // Results
        await driver.wait(until.elementLocated(By.css('.lupa-search-result-product-card')), 10000);
        await driver.sleep(quickSleep);
        const items = await driver.findElements(By.css('.lupa-search-result-product-card'));
        items.length.should.be.gte(10, 'At least 10 items should be found in the search results.');

        const topItems = items.slice(0, 10);

        // Random 3 items from the top 10
        const selectedItems = [];
        while (selectedItems.length < 3) {
            const randomIndex = Math.floor(Math.random() * topItems.length);
            if (!selectedItems.includes(randomIndex)) {
                selectedItems.push(randomIndex);
            }
        }

        // Add the selected items to the cart
        for (const index of selectedItems) {
            const item = topItems[index];

            // Hover over the item card to display the "Add to Cart" button
            await driver.actions().move({ origin: item }).perform();

            // Locate the "Add to Cart" button
            const addToCartButton = await item.findElement(By.css('.catalog-taxons-buy-button__button'));
            await addToCartButton.click();
            await driver.sleep(4000);

            // Wait for the cart confirmation popup to appear
            await driver.wait(until.elementLocated(By.css('#cart-popup-container')), 10000);
            const closePopupButton = await driver.findElement(By.css('.fancybox-close-small'));
            await closePopupButton.click();
            await driver.sleep(quickSleep);
        }

        // Navigation to the cart page
        await driver.get(`${websiteUrl}/cart`);

        // Retrieval of the names, prices, and links of items in the cart
        const cartItems = await driver.findElements(By.css('.detailed-cart-item'));
        cartItems.length.should.equal(3, 'There should be exactly 3 items in the cart.');

        const cartDetails = [];
        let totalSum = 0;

        for (const cartItem of cartItems) {
            const nameElement = await cartItem.findElement(By.css('.detailed-cart-item__name-link'));
            const name = await nameElement.getText();
            const link = await nameElement.getAttribute('href');

            // Price
            const priceElement = await cartItem.findElement(By.css('.detailed-cart-item__price'));
            const priceText = await priceElement.getText();

            // Price formatting
            const numericPrice = parseFloat(priceText.replace(/[^\d,.-]/g, '').replace(',', '.'));
            totalSum += numericPrice;

            cartDetails.push({ name, link, price: numericPrice });
        }

        // Output the cart details to Mocha report
        const cartSummaryLines = [];
        cartSummaryLines.push("🛒 Items in the cart:");
        cartDetails.forEach((item, index) => {
            cartSummaryLines.push(`${index + 1}. Price: €${item.price.toFixed(2)}, Name: ${item.name}, Link: ${item.link}`);
        });
        cartSummaryLines.push(`💰 Total sum of items: €${totalSum.toFixed(2)}`);

        const cartSummary = cartSummaryLines.join('\n');
        console.log(cartSummary);

        // Attach to Mocha context
        this.test.context = {
            title: '🛒 Cart Summary',
            value: cartSummary
        };

        // Verify cart details
        cartDetails.forEach(item => {
            item.name.should.not.be.empty;
            item.link.should.not.be.empty;
        });
    });
});